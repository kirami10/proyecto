from django.contrib import admin
from .models import (
    Profile, Producto, Plan, Suscripcion, 
    Carrito, CarritoItem, Pedido, PedidoItem,
    Review, Noticia, Notificacion, 
    ProductoImagen # <-- AÑADIR IMPORT
)

# --- CONFIGURACIÓN ESPECIAL PARA PRODUCTO ---
class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 1

class ProductoAdmin(admin.ModelAdmin):
    inlines = [ProductoImagenInline]

# Registros
admin.site.register(Profile)
admin.site.register(Producto, ProductoAdmin) # <-- USAR LA CLASE PERSONALIZADA
admin.site.register(Plan)
admin.site.register(Suscripcion)
admin.site.register(Carrito)
admin.site.register(CarritoItem)
admin.site.register(Pedido)
admin.site.register(PedidoItem)
admin.site.register(Review)
admin.site.register(Noticia)
admin.site.register(Notificacion)
# admin.site.register(ProductoImagen) # No es necesario registrarlo suelto si está inline