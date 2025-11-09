from django.urls import path
from .views import RegisterView, ProfileView
# Ya no necesitamos importar TokenObtainPairView ni TokenRefreshView aquí

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    # ELIMINAR O COMENTAR ESTAS LÍNEAS:
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]