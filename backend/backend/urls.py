from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Esta única línea ahora maneja TODAS las rutas de tu API:
    # /api/token/
    # /api/register/
    # /api/productos/
    # /api/webpay/create/
    # etc.
    path('api/', include('tienda.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)