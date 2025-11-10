from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import Profile, Producto, Plan

# --- Serializador para Token JWT (con roles) ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff

        # Aquí definimos rol basado en staff / superuser / contadora
        profile = getattr(user, 'profile', None)
        if user.is_superuser:
            token['role'] = 'admin'
        elif profile and getattr(profile, 'role', None):
            token['role'] = profile.role  # contadora o cliente
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
        
        # Datos extra del perfil
        nombre = self.context.get('nombre')
        apellidos = self.context.get('apellidos')
        rut = self.context.get('rut')
        numero_personal = self.context.get('numero_personal')
        numero_emergencia = self.context.get('numero_emergencia')

        if rut and Profile.objects.filter(rut=rut).exists():
            raise serializers.ValidationError({"rut": "Este RUT ya está registrado"})

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=nombre if nombre else '',
            last_name=apellidos if apellidos else ''
        )

        Profile.objects.create(
            user=user,
            nombre=nombre,
            apellidos=apellidos,
            rut=rut,
            numero_personal=numero_personal,
            numero_emergencia=numero_emergencia
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

        # Actualizamos is_staff y is_superuser según role
        user = instance.user
        if role == 'admin':
            user.is_staff = True
            user.is_superuser = True
        elif role == 'contadora':
            user.is_staff = True
            user.is_superuser = False
        else:  # cliente
            user.is_staff = False
            user.is_superuser = False
        if email and user.email != email:
            user.email = email
        user.save()

        return instance

# --- Serializador para Productos ---
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'