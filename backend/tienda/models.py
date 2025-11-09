from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Nuevo campo para la foto de perfil
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    nombre = models.CharField(max_length=50, null=True, blank=True)
    apellidos = models.CharField(max_length=50, null=True, blank=True)
    rut = models.CharField(max_length=12, unique=True)
    numero_personal = models.CharField(max_length=15, blank=True)
    numero_emergencia = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return self.user.username