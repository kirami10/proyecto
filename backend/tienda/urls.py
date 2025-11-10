from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, ProfileView, ProductoViewSet

# Router para ViewSets
router = DefaultRouter()
router.register(r'productos', ProductoViewSet) # Crea rutas como /api/productos/

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('', include(router.urls)), # Incluye las rutas generadas por el router
]