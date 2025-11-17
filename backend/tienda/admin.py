from django.contrib import admin
from .models import (
    Profile, Producto, Plan, Suscripcion, 
    Carrito, CarritoItem, Pedido, PedidoItem,
    Review  # <-- AÑADIR IMPORT
)

# Registra todos tus modelos para que el Admin (Dueño) pueda verlos
admin.site.register(Profile)
admin.site.register(Producto)
admin.site.register(Plan)
admin.site.register(Suscripcion)
admin.site.register(Carrito)
admin.site.register(CarritoItem)
admin.site.register(Pedido)
admin.site.register(PedidoItem)
admin.site.register(Review) # <-- AÑADIR ESTA LÍNEA