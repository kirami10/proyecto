from django.db import models
from django.contrib.auth.models import User

# Modelo de Perfil de Usuario
# models.py
class Profile(models.Model):
    ROLE_CHOICES = (
        ('cliente', 'Cliente'),
        ('admin', 'Administrador'),
        ('contadora', 'Contadora'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    nombre = models.CharField(max_length=50, null=True, blank=True)
    apellidos = models.CharField(max_length=50, null=True, blank=True)
    rut = models.CharField(max_length=12, unique=True)
    numero_personal = models.CharField(max_length=15, blank=True)
    numero_emergencia = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cliente')  # <-- NUEVO

    def __str__(self):
        return self.user.username


# NUEVO: Modelo de Producto
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.IntegerField() # Usamos IntegerField para pesos chilenos
    stock = models.IntegerField(default=0)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre
    