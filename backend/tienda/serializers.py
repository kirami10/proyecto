from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import Review
# --- MODIFICADO: Añadimos Pedido y PedidoItem ---
from .models import (
    Profile, Producto, Plan, Suscripcion, Carrito, CarritoItem, 
    Pedido, PedidoItem, Noticia
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
        # ... (código de creación de usuario y perfil sin cambios) ...
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
        # ... (código de actualización de perfil sin cambios) ...
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

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SuscripcionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True) 
    class Meta:
        model = Suscripcion
        fields = ['id', 'plan', 'fecha_inicio', 'fecha_vencimiento', 'activa']


# --- Serializers de Carrito ---
class CarritoItemSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.CharField(source='producto.nombre', read_only=True)
    precio_producto = serializers.IntegerField(source='producto.precio', read_only=True)
    imagen_producto = serializers.ImageField(source='producto.imagen', read_only=True)
    subtotal = serializers.IntegerField(read_only=True) # <-- Lee la property 'subtotal'

    class Meta:
        model = CarritoItem
        fields = ['id', 'producto', 'nombre_producto', 'precio_producto', 'imagen_producto', 'cantidad', 'subtotal']

class CarritoSerializer(serializers.ModelSerializer):
    items = CarritoItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField() # <-- Campo total calculado

    class Meta:
        model = Carrito
        fields = ['id', 'user', 'items', 'total']

    def get_total(self, obj):
        # Calcula el total sumando subtotales de items
        return sum(item.subtotal for item in obj.items.all())


# --- AÑADIDO: Serializers de Pedido ---

class PedidoItemSerializer(serializers.ModelSerializer):
    """
    Serializa un item de un pedido (lo que el usuario compró).
    """
    # Obtenemos el nombre y la imagen del producto relacionado
    nombre_producto = serializers.CharField(source='producto.nombre', read_only=True)
    imagen_producto = serializers.ImageField(source='producto.imagen', read_only=True)

    class Meta:
        model = PedidoItem
        fields = ['id', 'producto', 'nombre_producto', 'imagen_producto', 
                  'cantidad', 'precio_al_momento_compra']


class PedidoSerializer(serializers.ModelSerializer):
    """
    Serializa un pedido completo, incluyendo sus items.
    """
    # Usamos el PedidoItemSerializer anidado para mostrar los items
    items = PedidoItemSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'user', 'orden_compra', 'monto_total', 
                  'creado_en', 'estado', 'items']

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'producto', 'user', 'username', 
            'rating', 'comentario', 'creado_en', 
            'is_visible'  # <-- AÑADIR ESTO A LA LISTA
        ]
        read_only_fields = ('user', 'producto')

class NoticiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticia
        fields = '__all__'