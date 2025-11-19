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
    # Asegúrate de tener esta vista importada si la usas en tus rutas (MiPlan.js la necesita)
    HistorialPlanesView, 
    descargar_boleta,
    product_reviews,
    moderate_review_detail,
    NoticiaViewSet,
    NotificacionViewSet, # <-- ¡CONSOLIDADO!
)
from .views_webpay import webpay_create, webpay_return 

router = DefaultRouter()

# --- CORRECCIÓN AQUÍ: Agregamos basename='producto' (Lo mantengo de la corrección anterior) ---
router.register(r'productos', ProductoViewSet, basename='producto')
# ------------------------------------------------------------------------------------------

router.register(r'usuarios', UserAdminViewSet)
router.register(r'planes', PlanViewSet)
router.register(r'noticias', NoticiaViewSet)
router.register(r'notificaciones', NotificacionViewSet) # <-- ¡CONSOLIDADO!

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('mi-plan/', MiPlanView.as_view(), name='mi_plan'),
    
    # Asegúrate de tener esta vista importada si usas esta ruta
    path('historial-planes/', HistorialPlanesView.as_view(), name='historial_planes'),
    
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

    path('reviews/<int:review_id>/moderate/', moderate_review_detail, name='moderate-review-detail'),

    path('', include(router.urls)),
]