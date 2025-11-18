from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import (
    Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem,
    Pedido, PedidoItem, Review # <-- AÑADIDO Review
)
from .serializers import (
    RegisterSerializer, ProfileSerializer, MyTokenObtainPairSerializer, 
    ProductoSerializer, PlanSerializer, SuscripcionSerializer, 
    CarritoSerializer, CarritoItemSerializer,
    PedidoSerializer, ReviewSerializer # <-- AÑADIDO ReviewSerializer
)
import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .utils import render_to_pdf # Importación de PDF


# --- Vista de Token (Sin cambios) ---
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- Vista de Registro (Sin cambios) ---
class RegisterView(APIView):
    def post(self, request):
        data = request.data
        serializer = RegisterSerializer(data=data, context=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado correctamente"}, status=201)
        return Response(serializer.errors, status=400)

# --- Vista de Perfil (Sin cambios) ---
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

# --- Vistas de Producto, Admin, Plan, MiPlan (Sin cambios) ---
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

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
    
class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

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


# --- Vistas del Carrito (Sin cambios) ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_carrito(request):
    carrito, created = Carrito.objects.get_or_create(user=request.user)
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agregar_al_carrito(request):
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
    
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def actualizar_item_carrito(request, item_id):
    try:
        item = CarritoItem.objects.get(id=item_id, carrito__user=request.user)
    except CarritoItem.DoesNotExist:
        return Response({"error": "Item no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    cantidad = int(request.data.get('cantidad', item.cantidad))
    
    if cantidad <= 0:
        item.delete()
    else:
        item.cantidad = cantidad
        item.save()
    
    carrito = Carrito.objects.get(user=request.user)
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_item_carrito(request, item_id):
    try:
        item = CarritoItem.objects.get(id=item_id, carrito__user=request.user)
    except CarritoItem.DoesNotExist:
        return Response({"error": "Item no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    item.delete()
    
    carrito = Carrito.objects.get(user=request.user)
    serializer = CarritoSerializer(carrito)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vaciar_carrito(request):
    try:
        carrito = Carrito.objects.get(user=request.user)
        carrito.items.all().delete()
        serializer = CarritoSerializer(carrito)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Carrito.DoesNotExist:
        return Response({"error": "Carrito no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Vistas de Pedido/Boleta (Sin cambios) ---
class HistorialPedidosView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        pedidos = Pedido.objects.filter(user=request.user).order_by('-creado_en')
        serializer = PedidoSerializer(pedidos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_boleta(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    if pedido.user != request.user and not request.user.is_staff:
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
    context = {
        'pedido': pedido,
    }
    for item in context['pedido'].items.all():
        item.subtotal = item.cantidad * item.precio_al_momento_compra
    pdf = render_to_pdf('tienda/boleta.html', context)
    return pdf


# --- VISTAS DE RESEÑAS (MODIFICADAS) ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly]) 
def product_reviews(request, producto_id):
    """
    (GET) Obtiene reseñas: TODAS para el admin, VISIBLES para el público.
    (POST) Crea una nueva reseña (visible por defecto).
    """
    producto = get_object_or_404(Producto, id=producto_id)

    if request.method == 'GET':
        # --- LÓGICA DE VISIBILIDAD MODIFICADA ---
        if request.user.is_authenticated and request.user.is_staff:
            # Si el usuario es staff (Admin o Contadora), ve todo
            reviews = Review.objects.filter(producto=producto).order_by('-creado_en')
        else:
            # El público general solo ve las reseñas visibles
            reviews = Review.objects.filter(producto=producto, is_visible=True).order_by('-creado_en')
        # --- FIN DE LA MODIFICACIÓN ---
            
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        user = request.user
        
        if Review.objects.filter(producto=producto, user=user).exists():
            return Response({"error": "Ya has comentado este producto"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            # El modelo se encarga de 'is_visible=True' por defecto
            serializer.save(user=user, producto=producto)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAdminUser]) # <-- ¡Solo el Dueño (Admin) puede usar esto!
def moderate_review_detail(request, review_id):
    """
    (Admin) Oculta o muestra una reseña específica.
    Espera un body: { "is_visible": false } o { "is_visible": true }
    """
    review = get_object_or_404(Review, id=review_id)
    
    serializer = ReviewSerializer(review, data=request.data, partial=True, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)