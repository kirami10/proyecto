from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import Profile

# NUEVO: Serializador personalizado para incluir roles en el token
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añadir campos personalizados al token (payload JWT)
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff

        return token

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

        # Obtenemos datos extra del contexto
        nombre = self.context.get('nombre')
        apellidos = self.context.get('apellidos')
        rut = self.context.get('rut')
        numero_personal = self.context.get('numero_personal')
        numero_emergencia = self.context.get('numero_emergencia')

        # Verificar que no exista un Profile con el mismo RUT
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
    # Campos obtenidos del modelo User relacionado
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username',
            'email',
            'avatar',
            'nombre',
            'apellidos',
            'rut',
            'numero_personal',
            'numero_emergencia'
        ]
        read_only_fields = ['rut', 'username', 'email']