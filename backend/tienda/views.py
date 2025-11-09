from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView # Import necesario
from django.contrib.auth.models import User
from .models import Profile
from .serializers import RegisterSerializer, ProfileSerializer, MyTokenObtainPairSerializer # Importamos el nuevo serializer

# NUEVO: Vista personalizada para el token
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(APIView):
    def post(self, request):
        data = request.data
        serializer = RegisterSerializer(
            data=data,
            context={
                'nombre': data.get('nombre'),
                'apellidos': data.get('apellidos'),
                'rut': data.get('rut'),
                'numero_personal': data.get('numero_personal'),
                'numero_emergencia': data.get('numero_emergencia')
            }
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado correctamente"}, status=201)
        return Response(serializer.errors, status=400)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self, user):
        try:
            return Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return None

    def get(self, request):
        profile = self.get_object(request.user)
        if profile is None:
             return Response({"error": "Perfil no encontrado"}, status=404)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = self.get_object(request.user)
        if profile is None:
            return Response({"error": "Perfil no encontrado"}, status=404)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)