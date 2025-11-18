from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from dateutil.relativedelta import relativedelta

# Modelo de Perfil de Usuario
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
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cliente')

    def __str__(self):
        return self.user.username

# Modelo de Producto
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
    
class Plan(models.Model):
    nombre = models.CharField(max_length=50)
    precio = models.DecimalField(max_digits=10, decimal_places=0)  # Precio mensual
    duracion_meses = models.PositiveIntegerField(default=1)  # Duración en meses
    descripcion = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} - ${self.precio}/mes"

class Suscripcion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="suscripciones")
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField()
    activa = models.BooleanField(default=True)
    orden_compra = models.CharField(max_length=100, unique=True, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan.nombre} ({'Activa' if self.activa else 'Inactiva'})"

    def save(self, *args, **kwargs):
        if not self.pk:
            Suscripcion.objects.filter(user=self.user, activa=True).update(activa=False)
            self.fecha_vencimiento = timezone.now() + relativedelta(months=self.plan.duracion_meses)
        super().save(*args, **kwargs)


# --- AÑADIDO: Modelos de Carrito ---
class Carrito(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='carrito')
    creado_en = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Carrito de {self.user.username}"

class CarritoItem(models.Model):
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    @property # <-- Convertido a property
    def subtotal(self):
        return self.producto.precio * self.cantidad

    def __str__(self): # <-- Corregido de 'str' a '__str__'
        return f"{self.producto.nombre} x {self.cantidad}"
    
class Pedido(models.Model):
    """
    Representa una orden de compra de productos completada (pagada).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pedidos")
    orden_compra = models.CharField(max_length=100, unique=True) # El buy_order de Webpay
    monto_total = models.IntegerField()
    creado_en = models.DateTimeField(auto_now_add=True)
    
    ESTADO_CHOICES = (
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('FALLIDO', 'Fallido'),
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADO')

    def __str__(self):
        return f"Pedido {self.id} de {self.user.username}"

class PedidoItem(models.Model):
    """
    Representa un item dentro de un Pedido.
    """
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT) # Proteger para no borrar producto si está en un pedido
    cantidad = models.PositiveIntegerField(default=1)
    # Guardamos el precio al momento de la compra
    precio_al_momento_compra = models.IntegerField() 

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"

class Review(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(default=5) # Rating de 1 a 5
    comentario = models.TextField(blank=True, null=True)
    
    # --- AÑADIR ESTA LÍNEA ---
    is_visible = models.BooleanField(default=True) # Por defecto, todas las reseñas son visibles
    # --- FIN DE LA ADICIÓN ---

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('producto', 'user')
        ordering = ['-creado_en']

    def __str__(self):
        return f'Review de {self.user.username} para {self.producto.nombre}'

class Noticia(models.Model):
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    imagen = models.ImageField(upload_to='noticias/', null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo