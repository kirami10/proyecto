from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# Add webpay_create to the imports
from tienda.views import MyTokenObtainPairView, webpay_init, webpay_return, webpay_create
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tienda.urls')),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/webpay/init/', webpay_init, name='webpay_init'),
    path('api/webpay/return/', webpay_return, name='webpay_return'),
    path('api/webpay/create/', webpay_create, name='webpay_create'),  # ✅ ADD THIS LINE
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)