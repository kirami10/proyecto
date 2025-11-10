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
    # Puedes descomentar la siguiente línea para restringir quién puede crear/editar
    # permission_classes = [IsAuthenticatedOrReadOnly]