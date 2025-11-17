from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem # <--- MODIFICADO
from .serializers import (
    RegisterSerializer, ProfileSerializer, MyTokenObtainPairSerializer, 
    ProductoSerializer, PlanSerializer, SuscripcionSerializer, CarritoSerializer, CarritoItemSerializer # <--- MODIFICADO
)
import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .utils import render_to_pdf
from .models import Review # <-- AÑADIR IMPORT
from .serializers import ReviewSerializer # <-- AÑADIR IMPORT

# ... (Vista MyTokenObtainPairView sin cambios) ...
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ... (Vista RegisterView sin cambios) ...
class RegisterView(APIView):
    def post(self, request):
        data = request.data
        serializer = RegisterSerializer(data=data, context=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado correctamente"}, status=201)
        return Response(serializer.errors, status=400)

# ... (Vista ProfileView sin cambios) ...
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    def get_object(self, user):
        try: return Profile.objects.get(user=user)
        except Profile.DoesNotExist: return None
    def get(self, request):
        profile = self.get_object(request.user)
        if not profile: return Response({"error": "Perfil no encontrado"}, status=404)
        return Response(ProfileSerializer(profile).data)
    def patch(self, request):
        profile = self.get_object(request.user)
        if not profile: return Response({"error": "Perfil no encontrado"}, status=404)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# ... (Vista ProductoViewSet sin cambios) ...
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

# ... (Vista UserAdminViewSet sin cambios) ...
class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = []
        for profile, ser_data in zip(queryset, serializer.data):
            ser_data['activo'] = profile.user.is_active
            data.append(ser_data)
        return Response(data)
    def get_object(self):
        user_id = self.kwargs.get('pk')
        return get_object_or_404(Profile, user__id=user_id)
    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        is_active = request.data.get('is_active')
        if is_active is not None:
            profile.user.is_active = is_active
            profile.user.save()
        role = request.data.get('role')
        if role:
            profile.role = role
            if role == 'admin':
                profile.user.is_staff = True; profile.user.is_superuser = True
            elif role == 'contadora':
                profile.user.is_staff = True; profile.user.is_superuser = False
            else:
                profile.user.is_staff = False; profile.user.is_superuser = False
            profile.user.save()
            profile.save()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response_data = serializer.data
        response_data['activo'] = profile.user.is_active
        return Response(response_data)
    
# ... (Vista PlanViewSet sin cambios) ...
class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

# ... (Vista MiPlanView sin cambios) ...
class MiPlanView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        suscripcion = Suscripcion.objects.filter(
            user=request.user, 
            activa=True
        ).order_by('-fecha_vencimiento').first()
        if not suscripcion:
            return Response(None, status=status.HTTP_200_OK) 
        serializer = SuscripcionSerializer(suscripcion)
        return Response(serializer.data)


# --- AÑADIDO: Vistas del Carrito ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_carrito(request):
    # Corregido: get_or_create devuelve (objeto, created)
    carrito, created = Carrito.objects.get_or_create(user=request.user)
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_al_carrito(request):
    # Usamos 'producto_id' por convención
    producto_id = request.data.get('producto_id')
    cantidad = int(request.data.get('cantidad', 1))
    
    if not producto_id:
        return Response({"error": "producto_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        producto = Producto.objects.get(id=producto_id)
    except Producto.DoesNotExist:
        return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    carrito, created = Carrito.objects.get_or_create(user=request.user)
    
    carrito_item, created = CarritoItem.objects.get_or_create(
        carrito=carrito, 
        producto=producto
    )
    
    if not created:
        carrito_item.cantidad += cantidad
    else:
        carrito_item.cantidad = cantidad
    
    carrito_item.save()
    
    # Devolvemos el carrito actualizado, es más útil que un simple mensaje
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def actualizar_item_carrito(request, item_id):
    try:
        # Corregido: El bug era 'carritouser', se cambió a 'carrito__user'
        item = CarritoItem.objects.get(id=item_id, carrito__user=request.user)
    except CarritoItem.DoesNotExist:
        return Response({"error": "Item no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    cantidad = int(request.data.get('cantidad', item.cantidad))
    
    if cantidad <= 0:
        item.delete()
    else:
        item.cantidad = cantidad
        item.save()
    
    # Devolvemos el carrito actualizado
    carrito = Carrito.objects.get(user=request.user)
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_item_carrito(request, item_id):
    try:
        # Corregido: El bug era 'carritouser', se cambió a 'carrito__user'
        item = CarritoItem.objects.get(id=item_id, carrito__user=request.user)
    except CarritoItem.DoesNotExist:
        return Response({"error": "Item no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    item.delete()
    
    # Devolvemos el carrito actualizado
    carrito = Carrito.objects.get(user=request.user)
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data)

@api_view(['POST']) # Usamos POST por seguridad
@permission_classes([IsAuthenticated])
def vaciar_carrito(request):
    """
    Elimina todos los items del carrito del usuario autenticado.
    """
    try:
        carrito = Carrito.objects.get(user=request.user)
        carrito.items.all().delete() # Borra todos los CarritoItem asociados
        
        # Devuelve el carrito actualizado (ahora vacío)
        serializer = CarritoSerializer(carrito)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Carrito.DoesNotExist:
        # Esto no debería pasar si se usa get_or_create, pero por si acaso
        return Response({"error": "Carrito no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .models import Pedido # Asegúrate de importar Pedido
from .serializers import PedidoSerializer # Asegúrate de importar PedidoSerializer

class HistorialPedidosView(APIView):
    """
    Vista para que el usuario autenticado vea su historial de pedidos.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Obtenemos los pedidos del usuario, del más reciente al más antiguo
        pedidos = Pedido.objects.filter(user=request.user).order_by('-creado_en')
        
        # Usamos many=True porque es una lista de pedidos
        serializer = PedidoSerializer(pedidos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_boleta(request, pedido_id):
    """
    Genera y devuelve la boleta en PDF para un pedido específico.
    """
    # 1. Obtenemos el pedido
    pedido = get_object_or_404(Pedido, id=pedido_id)

    # 2. !! IMPORTANTE: Verificación de seguridad !!
    # Solo el dueño del pedido o un staff/admin pueden ver la boleta.
    if pedido.user != request.user and not request.user.is_staff:
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    # 3. Preparamos el contexto para la plantilla
    context = {
        'pedido': pedido,
        # (Podemos añadir más datos si es necesario)
    }

    # 4. Añadimos subtotales a cada item (si no están en el modelo)
    # (Lo hacemos aquí para que el template sea simple)
    for item in context['pedido'].items.all():
        item.subtotal = item.cantidad * item.precio_al_momento_compra

    # 5. Renderizamos el PDF usando nuestra utilidad
    pdf = render_to_pdf('tienda/boleta.html', context)
    
    return pdf

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly]) # GET (ver) es público, POST (crear) requiere login
def product_reviews(request, producto_id):
    """
    Obtiene todas las reseñas de un producto (GET)
    o crea una nueva reseña para un producto (POST).
    """
    producto = get_object_or_404(Producto, id=producto_id)

    if request.method == 'GET':
        reviews = Review.objects.filter(producto=producto).order_by('-creado_en')
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        user = request.user
        
        # Revisamos si el usuario ya comentó este producto
        if Review.objects.filter(producto=producto, user=user).exists():
            return Response({"error": "Ya has comentado este producto"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user, producto=producto)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)