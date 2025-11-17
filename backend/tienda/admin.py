from django.contrib import admin
from .models import Pedido, PedidoItem, Suscripcion, Plan, Producto, Profile

admin.site.register(Producto)
admin.site.register(Plan)
admin.site.register(Suscripcion)
admin.site.register(Pedido)
admin.site.register(PedidoItem)
admin.site.register(Profile)