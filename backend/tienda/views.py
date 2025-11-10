from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser # <--- IMPORTANTE: Agregado JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Profile, Producto
from .serializers import RegisterSerializer, ProfileSerializer, MyTokenObtainPairSerializer, ProductoSerializer

# Vista personalizada para obtener Token JWT
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Vista para Registro
class RegisterView(APIView):
    def post(self, request):
        data = request.data
        serializer = RegisterSerializer(data=data, context=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado correctamente"}, status=201)
        return Response(serializer.errors, status=400)

# Vista para Perfil
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    # IMPORTANTE: Agregamos JSONParser para permitir actualizaciones sin archivos
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self, user):
        try:
            return Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return None

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

# ViewSet para Productos (CRUD completo)
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer


from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Profile
from .serializers import ProfileSerializer

class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    # Sobrescribir list para incluir is_active
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = []
        for profile, ser_data in zip(queryset, serializer.data):
            ser_data['activo'] = profile.user.is_active
            data.append(ser_data)
        return Response(data)

    # Sobrescribir get_object para que tome pk correctamente
    def get_object(self):
        user_id = self.kwargs.get('pk')
        return get_object_or_404(Profile, user__id=user_id)

    # Sobrescribir update para actualizar tanto profile como is_active
    def update(self, request, *args, **kwargs):
        profile = self.get_object()

        # Actualizar is_active si viene en request
        is_active = request.data.get('is_active')
        if is_active is not None:
            profile.user.is_active = is_active
            profile.user.save()

        # Actualizar otros campos del profile
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Agregar estado actualizado en la respuesta
        response_data = serializer.data
        response_data['activo'] = profile.user.is_active

        return Response(response_data)
