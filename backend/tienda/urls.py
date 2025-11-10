from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, UserAdminViewSet, RegisterView, ProfileView, PlanViewSet

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'usuarios', UserAdminViewSet)
router.register(r'planes', PlanViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('', include(router.urls)),  # Esto incluye las rutas generadas por DefaultRouter
]
