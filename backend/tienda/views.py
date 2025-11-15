from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser # <--- IMPORTANTE: Agregado JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Profile, Producto, Plan
from .serializers import RegisterSerializer, ProfileSerializer, MyTokenObtainPairSerializer, ProductoSerializer, PlanSerializer
import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

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

        # Actualizar is_active si viene en request
        is_active = request.data.get('is_active')
        if is_active is not None:
            profile.user.is_active = is_active
            profile.user.save()

        # Actualizar role si viene en request
        role = request.data.get('role')
        if role:
            profile.role = role
            # Actualizamos is_staff/is_superuser según role
            if role == 'admin':
                profile.user.is_staff = True
                profile.user.is_superuser = True
            elif role == 'contadora':
                profile.user.is_staff = True
                profile.user.is_superuser = False
            else:  # cliente
                profile.user.is_staff = False
                profile.user.is_superuser = False
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

    # Solo admin puede crear, actualizar o eliminar
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

# --- INTEGRACIÓN WEBPAY PLUS ---
import json, requests, time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

@csrf_exempt
def webpay_init(request):
    """
    Crea una transacción en el entorno de integración de Webpay Plus
    """
    data = json.loads(request.body)
    amount = data.get("amount", 1000)
    buy_order = f"ORD{int(time.time())}"
    session_id = f"SES{int(time.time())}"

    payload = {
        "buy_order": buy_order,
        "session_id": session_id,
        "amount": amount,
        "return_url": settings.WEBPAY_RETURN_URL,
    }

    headers = {
        "Tbk-Api-Key-Id": settings.TRANSBANK_API_KEY_ID,
        "Tbk-Api-Key-Secret": settings.TRANSBANK_API_KEY_SECRET,
        "Content-Type": "application/json",
    }

    url = f"{settings.TRANSBANK_BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions"
    resp = requests.post(url, json=payload, headers=headers)
    return JsonResponse(resp.json(), safe=False)


@csrf_exempt
def webpay_return(request):
    """
    Procesa el retorno desde Webpay y obtiene el resultado de la transacción
    """
    token = request.POST.get("token_ws")
    if not token:
        return JsonResponse({"error": "Token no recibido"}, status=400)

    headers = {
        "Tbk-Api-Key-Id": settings.TRANSBANK_API_KEY_ID,
        "Tbk-Api-Key-Secret": settings.TRANSBANK_API_KEY_SECRET,
        "Content-Type": "application/json",
    }

    # Obtener resultado
    result_url = f"{settings.TRANSBANK_BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions/{token}"
    result = requests.put(result_url, headers=headers).json()

    # Confirmar recepción
    requests.post(f"{result_url}/acknowledge", headers=headers)

    # Redirigir al frontend
    status = "success" if result.get("response_code") == 0 else "failed"
    redirect_url = f"{settings.WEBPAY_FINAL_URL}?token={token}&status={status}"

    return JsonResponse({"redirect_url": redirect_url, "result": result})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webpay_create(request):
    try:
        data = request.data
        amount = int(data.get('amount', 1000))
        buy_order = data.get('buy_order', f"ORD{int(time.time())}")
        session_id = data.get('session_id', f"SES{int(time.time())}")
        return_url = data.get('return_url', 'http://localhost:3000/webpay/return')

        # ✅ CORRECT credentials
        commerce_code = "597055555532"
        api_key_secret = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"  # ← Fixed!

        headers = {
            "Tbk-Api-Key-Id": commerce_code,
            "Tbk-Api-Key-Secret": api_key_secret,
            "Content-Type": "application/json",
        }

        payload = {
            "buy_order": buy_order,
            "session_id": session_id,
            "amount": amount,
            "return_url": return_url,
        }

        print(f"🚀 Usuario: {request.user.username}")
        print(f"🚀 Transacción: {payload}")

        url = "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions"
        response = requests.post(url, headers=headers, json=payload)

        try:
            resp_data = response.json()
        except ValueError:
            return JsonResponse({"error": "Respuesta no válida de Transbank", "raw": response.text}, status=500)

        print(f"📥 Transbank responde: {resp_data}")

        if response.status_code == 200 and "token" in resp_data:
            return JsonResponse({
                "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
                "token": resp_data["token"]
            })
        else:
            return JsonResponse({
                "error": resp_data,
                "status_code": response.status_code
            }, status=response.status_code)

    except Exception as e:
        print(f"❌ Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)