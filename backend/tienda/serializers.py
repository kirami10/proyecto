from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import Profile, Producto

# --- Serializador para Token JWT (con roles) ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff
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

# --- Serializador para Perfil de Usuario (con actualización) ---
class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Profile
        fields = ['username', 'email', 'avatar', 'nombre', 'apellidos', 'rut', 'numero_personal', 'numero_emergencia']
        read_only_fields = ['rut', 'username']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email')

        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.apellidos = validated_data.get('apellidos', instance.apellidos)
        instance.numero_personal = validated_data.get('numero_personal', instance.numero_personal)
        instance.numero_emergencia = validated_data.get('numero_emergencia', instance.numero_emergencia)
        
        if 'avatar' in validated_data:
             instance.avatar = validated_data['avatar']

        instance.save()

        user = instance.user
        user_changed = False
        if email and user.email != email:
            user.email = email
            user_changed = True
        if instance.nombre and user.first_name != instance.nombre:
            user.first_name = instance.nombre
            user_changed = True
        if instance.apellidos and user.last_name != instance.apellidos:
            user.last_name = instance.apellidos
            user_changed = True
        if user_changed:
            user.save()

        return instance

# --- Serializador para Productos ---
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'