from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
<<<<<<< Updated upstream
<<<<<<< Updated upstream
from django.db.models import Avg, Sum 
from rest_framework.decorators import api_view, permission_classes, action
import json 
from django.shortcuts import get_object_or_404
# --- IMPORTACIÓN DE MODELOS (LISTA CONSOLIDADA) ---
from .models import (
    Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem,
    Pedido, PedidoItem, Review, Noticia, Notificacion, ProductoImagen # <-- Todos los modelos
)
# --- IMPORTACIÓN DE SERIALIZERS (LISTA CONSOLIDADA) ---
=======
from django.db.models import Avg, Sum # Para ProductoSerializer
from rest_framework.decorators import api_view, permission_classes, action
import json
from django.shortcuts import get_object_or_404
# --- Importación de Modelos ---
from .models import (
    Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem,
    Pedido, PedidoItem, Review, Noticia, Notificacion, ProductoImagen
)
# --- Importación de Serializers ---
>>>>>>> Stashed changes
=======
from django.db.models import Avg, Sum # Para ProductoSerializer
from rest_framework.decorators import api_view, permission_classes, action
import json
from django.shortcuts import get_object_or_404
# --- Importación de Modelos ---
from .models import (
    Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem,
    Pedido, PedidoItem, Review, Noticia, Notificacion, ProductoImagen
)
# --- Importación de Serializers ---
>>>>>>> Stashed changes
from .serializers import (
    RegisterSerializer, ProfileSerializer, MyTokenObtainPairSerializer, 
    ProductoSerializer, PlanSerializer, SuscripcionSerializer, 
    CarritoSerializer, CarritoItemSerializer,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    PedidoSerializer, ReviewSerializer, NoticiaSerializer, NotificacionSerializer # <-- Todos los serializers
)
from .utils import render_to_pdf
=======
=======
>>>>>>> Stashed changes
    PedidoSerializer, ReviewSerializer, NoticiaSerializer, NotificacionSerializer
)
from .utils import render_to_pdf # Importación de PDF
>>>>>>> Stashed changes

# --- VISTA DE AUTENTICACIÓN ---
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --- VISTA DE REGISTRO ---
class RegisterView(APIView):
    def post(self, request):
        data = request.data
        serializer = RegisterSerializer(data=data, context=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado correctamente"}, status=201)
        return Response(serializer.errors, status=400)

# --- VISTA DE PERFIL (CLIENTE/ADMIN) ---
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

# --- VISTA DE GESTIÓN DE USUARIOS (ADMIN) ---
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
    
# --- VISTA DE PLANES ---
class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

# --- VISTA DE MI PLAN ACTUAL ---
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

# --- VISTA DE HISTORIAL DE PLANES ---
class HistorialPlanesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        suscripciones = Suscripcion.objects.filter(user=request.user).order_by('-fecha_inicio')
        serializer = SuscripcionSerializer(suscripciones, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- VISTAS DE PRODUCTOS (GESTIÓN Y TIENDA) ---
class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            # Admin ve todos los productos, incluyendo inactivos
            return Producto.objects.all()
        # Cliente/Público solo ve productos activos
        return Producto.objects.filter(activo=True)

    # Lógica para la creación (manejo de multi-imagen)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        producto = serializer.save()
        
        imagenes = request.FILES.getlist('imagenes_extra')
        for img in imagenes:
            ProductoImagen.objects.create(producto=producto, imagen=img)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # Lógica para la actualización (manejo de multi-imagen y borrado)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        producto = serializer.save()

        # 1. BORRAR IMÁGENES ACCESORIAS (desde el JSON string)
        ids_json = request.data.get('ids_json') 
        
        if ids_json:
            try:
                ids_eliminar = json.loads(ids_json)
            except json.JSONDecodeError:
                ids_eliminar = []
        else:
            ids_eliminar = []
        
        if ids_eliminar:
            ids_enteros = [int(id_str) for id_str in ids_eliminar if str(id_str).isdigit()]
            if ids_enteros:
                ProductoImagen.objects.filter(id__in=ids_enteros, producto=producto).delete()

        # 2. BORRAR IMAGEN PRINCIPAL (si se envía la bandera 'clear_main_image')
        clear_main = request.data.get('clear_main_image') == 'true'
        
        if clear_main and 'imagen' not in request.FILES:
            if producto.imagen:
                producto.imagen.delete(save=False) 
            producto.imagen = None
            producto.save(update_fields=['imagen']) 
        
        # 3. AGREGAR IMÁGENES NUEVAS
        imagenes = request.FILES.getlist('imagenes_extra')
        for img in imagenes:
            ProductoImagen.objects.create(producto=producto, imagen=img)

        return Response(serializer.data)

    # Lógica para Soft Delete
    def destroy(self, request, *args, **kwargs):
        producto = self.get_object()
        producto.activo = False
        producto.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- VISTAS DE CARRITO (Sin cambios) ---
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

# --- VISTAS DE PEDIDO / BOLETA ---
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


# --- VISTAS DE RESEÑAS ---
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly]) 
def product_reviews(request, producto_id):
    producto = get_object_or_404(Producto, id=producto_id)

    if request.method == 'GET':
        if request.user.is_authenticated and request.user.is_staff:
            reviews = Review.objects.filter(producto=producto).order_by('-creado_en')
        else:
            reviews = Review.objects.filter(producto=producto, is_visible=True).order_by('-creado_en')
            
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        user = request.user
        
        if Review.objects.filter(producto=producto, user=user).exists():
            return Response({"error": "Ya has comentado este producto"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user, producto=producto)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAdminUser]) 
def moderate_review_detail(request, review_id):
    review = get_object_or_404(Review, id=review_id)
    
    serializer = ReviewSerializer(review, data=request.data, partial=True, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- VISTAS DE NOTIFICACIONES ---
class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all().order_by('-creado_en')
    serializer_class = NotificacionSerializer
    pagination_class = None 
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()] 
        return [IsAdminUser()]

    def list(self, request, *args, **kwargs):
        # Aseguramos que solo los usuarios logueados obtengan la lista
        if not request.user.is_authenticated:
            return Response({'detail': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        return super().list(request, *args, **kwargs)

@action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
def marcar_todas_leidas(request):
    user = request.user
    notificaciones_no_leidas = Notificacion.objects.exclude(leido_por=user)
    for notif in notificaciones_no_leidas:
        notif.leido_por.add(user)
    return Response({"status": "ok", "message": "Todas marcadas como leídas"})

class NoticiaViewSet(viewsets.ModelViewSet):
    """
    Vista para noticias.
    - Cualquiera puede ver (list/retrieve).
    - Solo el Admin puede crear/editar/borrar.
    """
    queryset = Noticia.objects.all().order_by('-creado_en')
    serializer_class = NoticiaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # GET: Permitido a todos (Público)
            permission_classes = [AllowAny]
        else:
            # POST, PUT, DELETE: Solo Admin
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]