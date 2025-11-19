from rest_framework import serializers
from django.db.models import Avg, Sum
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import (
    Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem, 
<<<<<<< HEAD
    Pedido, PedidoItem, Review, Noticia, Notificacion, ProductoImagen # <-- CONSOLIDADO
=======
    Pedido, PedidoItem
>>>>>>> parent of 281861c (se añadió el blog y sus respectivas funciones)
)

# --- Serializador para Token JWT (con roles) ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff
        token['user_id'] = user.id
        profile = getattr(user, 'profile', None)
        if user.is_superuser:
            token['role'] = 'admin'
        elif profile and getattr(profile, 'role', None):
            token['role'] = profile.role
        else:
            token['role'] = 'cliente'
        return token

# --- Serializador para Registro de Usuarios ---
class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']
        nombre = self.context.get('nombre')
        apellidos = self.context.get('apellidos')
        rut = self.context.get('rut')
        numero_personal = self.context.get('numero_personal')
        numero_emergencia = self.context.get('numero_emergencia')
        if rut and Profile.objects.filter(rut=rut).exists():
            raise serializers.ValidationError({"rut": "Este RUT ya está registrado"})
        user = User.objects.create_user(
            username=username, email=email, password=password,
            first_name=nombre if nombre else '', last_name=apellidos if apellidos else ''
        )
        Profile.objects.create(
            user=user, nombre=nombre, apellidos=apellidos, rut=rut,
            numero_personal=numero_personal, numero_emergencia=numero_emergencia
        )
        return user

class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email')
    class Meta:
        model = Profile
        fields = ['id', 'username', 'email', 'avatar', 'nombre', 'apellidos', 
                  'rut', 'numero_personal', 'numero_emergencia', 'role']
        read_only_fields = ['rut', 'username']
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email')
        role = validated_data.get('role', instance.role)
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.apellidos = validated_data.get('apellidos', instance.apellidos)
        instance.numero_personal = validated_data.get('numero_personal', instance.numero_personal)
        instance.numero_emergencia = validated_data.get('numero_emergencia', instance.numero_emergencia)
        instance.role = role
        if 'avatar' in validated_data:
             instance.avatar = validated_data['avatar']
        instance.save()
        user = instance.user
        if role == 'admin':
            user.is_staff = True; user.is_superuser = True
        elif role == 'contadora':
            user.is_staff = True; user.is_superuser = False
        else:
            user.is_staff = False; user.is_superuser = False
        if email and user.email != email:
            user.email = email
        user.save()
        return instance

class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen']

class ProductoSerializer(serializers.ModelSerializer):
    rating_promedio = serializers.SerializerMethodField()
    total_vendidos = serializers.SerializerMethodField()
    
    # Incluimos las imágenes extra (read_only porque la subida la manejamos manual en la vista)
    imagenes = ProductoImagenSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = '__all__'

    def get_rating_promedio(self, obj):
        promedio = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(promedio, 1) if promedio else 0

    def get_total_vendidos(self, obj):
        total = obj.pedidoitem_set.filter(pedido__estado='PAGADO').aggregate(Sum('cantidad'))['cantidad__sum']
        return total if total else 0

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SuscripcionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True) 
    class Meta:
        model = Suscripcion
        fields = ['id', 'plan', 'fecha_inicio', 'fecha_vencimiento', 'activa', 'orden_compra']


# --- Serializers de Carrito ---
class CarritoItemSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.CharField(source='producto.nombre', read_only=True)
    precio_producto = serializers.IntegerField(source='producto.precio', read_only=True)
    imagen_producto = serializers.ImageField(source='producto.imagen', read_only=True)
    

    # Este es el campo que causaba el error si no estaba en 'fields'

    # Este es el campo que causaba el error si no estaba en 'fields'

    stock_producto = serializers.IntegerField(source='producto.stock', read_only=True)
    
    subtotal = serializers.IntegerField(read_only=True)

    class Meta:
        model = CarritoItem

        # AÑADIDO 'stock_producto' AQUÍ ABAJO:

        # AÑADIDO 'stock_producto' AQUÍ ABAJO:

        fields = ['id', 'producto', 'nombre_producto', 'precio_producto', 'imagen_producto', 'stock_producto', 'cantidad', 'subtotal']

class CarritoSerializer(serializers.ModelSerializer):
    items = CarritoItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Carrito
        fields = ['id', 'user', 'items', 'total']

    def get_total(self, obj):
        return sum(item.subtotal for item in obj.items.all())


# --- Serializers de Pedido ---
class PedidoItemSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.CharField(source='producto.nombre', read_only=True)
    imagen_producto = serializers.ImageField(source='producto.imagen', read_only=True)

    class Meta:
        model = PedidoItem
        fields = ['id', 'producto', 'nombre_producto', 'imagen_producto', 
                  'cantidad', 'precio_al_momento_compra']


class PedidoSerializer(serializers.ModelSerializer):
    items = PedidoItemSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'user', 'orden_compra', 'monto_total', 
                  'creado_en', 'estado', 'items']


# --- Serializer de Reseña ---
class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'producto', 'user', 'username', 
            'rating', 'comentario', 'creado_en', 
            'is_visible' 
        ]
<<<<<<< HEAD
        read_only_fields = ('user', 'producto')


# --- Serializer de Noticia (Blog) ---
class NoticiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticia
        fields = '__all__'


# --- Serializer de Notificación ---
class NotificacionSerializer(serializers.ModelSerializer):
    leida = serializers.SerializerMethodField()

    class Meta:
        model = Notificacion
        fields = ['id', 'titulo', 'mensaje', 'tipo', 'creado_en', 'leida']

    def get_leida(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.leido_por.filter(id=request.user.id).exists()
        return False
=======
        read_only_fields = ('user', 'producto')
>>>>>>> parent of 281861c (se añadió el blog y sus respectivas funciones)
