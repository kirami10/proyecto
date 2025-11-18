from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importamos las vistas de autenticación
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView

# Importamos el resto de vistas
from .views import (
    ProductoViewSet, UserAdminViewSet, RegisterView, ProfileView, PlanViewSet, MiPlanView,
    obtener_carrito, agregar_al_carrito, actualizar_item_carrito, eliminar_item_carrito,
    vaciar_carrito,
    HistorialPedidosView,
    descargar_boleta,
    product_reviews,
    moderate_review_detail,
    NoticiaViewSet  # <--- AÑADIDO
)
from .views_webpay import webpay_create, webpay_return 

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'usuarios', UserAdminViewSet)
router.register(r'planes', PlanViewSet)
router.register(r'noticias', NoticiaViewSet)

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('mi-plan/', MiPlanView.as_view(), name='mi_plan'),
    path('historial-pedidos/', HistorialPedidosView.as_view(), name='historial_pedidos'),

    path('pedido/<int:pedido_id>/boleta/', descargar_boleta, name='descargar_boleta'),

    path('webpay/create/', webpay_create, name='webpay_create'),
    path('webpay/return/', webpay_return, name='webpay_return'),
    
    path('carrito/', obtener_carrito, name='obtener_carrito'),
    path('carrito/agregar/', agregar_al_carrito, name='agregar_al_carrito'),
    path('carrito/item/<int:item_id>/actualizar/', actualizar_item_carrito, name='actualizar_item_carrito'),
    path('carrito/item/<int:item_id>/eliminar/', eliminar_item_carrito, name='eliminar_item_carrito'),
    path('carrito/vaciar/', vaciar_carrito, name='vaciar_carrito'),
    
    path('productos/<int:producto_id>/reviews/', product_reviews, name='product-reviews'),

    # --- AÑADIDO: Ruta de Moderación de Reseñas ---
    path('reviews/<int:review_id>/moderate/', moderate_review_detail, name='moderate-review-detail'),

    path('', include(router.urls)),
]