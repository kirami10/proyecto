import json
import requests
import time
import re # <-- IMPORTANTE: Importamos Regex

from django.conf import settings
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.models import User
from .models import Plan, Suscripcion, Carrito, Pedido, PedidoItem, Producto 
from django.shortcuts import get_object_or_404
from django.db import transaction 


# Credenciales de Integración (Test)
TBK_API_KEY_ID = "597055555532"
TBK_API_KEY_SECRET = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"
TBK_URL_CREATE = "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webpay_create(request):
    """
    1. El Frontend llama aquí para iniciar el pago.
    """
    try:
        data = request.data
        amount = int(data.get('amount', 1000))
        
        # --- MODIFICADO: Usar SIEMPRE la buy_order CORTA del frontend ---
        buy_order = data.get('buy_order')
        if not buy_order:
            # Si el frontend no la envía, es un error.
            return JsonResponse({"error": "buy_order es requerida"}, status=400)
            
        session_id = data.get('session_id', f"SES-{int(time.time())}")
        
        # Usamos la return_url de settings.py
        return_url = settings.WEBPAY_RETURN_URL

        headers = {
            "Tbk-Api-Key-Id": TBK_API_KEY_ID,
            "Tbk-Api-Key-Secret": TBK_API_KEY_SECRET,
            "Content-Type": "application/json",
        }

        payload = {
            "buy_order": buy_order,
            "session_id": session_id,
            "amount": amount,
            "return_url": return_url,
        }

        response = requests.post(TBK_URL_CREATE, headers=headers, json=payload)
        resp_data = response.json()

        if response.status_code == 200 and "token" in resp_data:
            return JsonResponse({
                "url": resp_data["url"],
                "token": resp_data["token"],
                "buy_order": buy_order
            })
        else:
            return JsonResponse({"error": "Error creando transacción en Transbank", "details": resp_data}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@transaction.atomic 
def webpay_return(request):
    """
    2. Transbank devuelve al usuario aquí.
    3. Confirmamos la transacción.
    4. SI ES EXITOSO, guardamos la suscripción/orden.
    5. Redirigimos al Frontend.
    """
    token = request.POST.get("token_ws") or request.GET.get("token_ws")
    
    tbk_token = request.POST.get("TBK_TOKEN") or request.GET.get("TBK_TOKEN")
    if tbk_token and not token:
        frontend_url = f"{settings.WEBPAY_FINAL_URL}?status=aborted"
        return HttpResponseRedirect(frontend_url)

    if not token:
        return JsonResponse({"error": "Token no recibido"}, status=400)

    # Confirmar transacción (PUT)
    url_commit = f"{TBK_URL_CREATE}/{token}"
    headers = {
        "Tbk-Api-Key-Id": TBK_API_KEY_ID,
        "Tbk-Api-Key-Secret": TBK_API_KEY_SECRET,
        "Content-Type": "application/json",
    }

    response = requests.put(url_commit, headers=headers)
    result = response.json()
    
    status = "failed"
    buy_order = result.get('buy_order', '')
    
    if response.status_code == 200 and result.get("response_code") == 0:
        status = "success"
        
        try:
            # A. ¿Es una compra de Plan?
            # Formato: P<plan.id>U<user.id>T<timestamp>
            if buy_order.startswith("P"): # <-- MODIFICADO
                if not Suscripcion.objects.filter(orden_compra=buy_order).exists():
                
                    # --- MODIFICADO: Parsear la nueva buy_order CORTA ---
                    match = re.search(r'P(\d+)U(\d+)T(\d+)', buy_order)
                    if not match:
                        raise Exception("Formato de buy_order de Plan inválido")
                        
                    plan_id = match.group(1)
                    user_id = match.group(2)
                    # --- FIN MODIFICACIÓN ---
                    
                    user = get_object_or_404(User, id=user_id)
                    plan = get_object_or_404(Plan, id=plan_id)
                    
                    Suscripcion.objects.create(
                        user=user,
                        plan=plan,
                        orden_compra=buy_order
                    )
            
            # B. ¿Es una compra de Carrito?
            # Formato: C<user.id>T<timestamp>
            elif buy_order.startswith("C"): # <-- MODIFICADO
                if not Pedido.objects.filter(orden_compra=buy_order).exists():
                
                    # --- MODIFICADO: Parsear la nueva buy_order CORTA ---
                    match = re.search(r'C(\d+)T(\d+)', buy_order)
                    if not match:
                        raise Exception("Formato de buy_order de Carrito inválido")
                        
                    user_id = match.group(1)
                    # --- FIN MODIFICACIÓN ---

                    user = get_object_or_404(User, id=user_id)
                    
                    try:
                        carrito = Carrito.objects.get(user=user)
                    except Carrito.DoesNotExist:
                        raise Exception("Carrito no encontrado para pago")

                    nuevo_pedido = Pedido.objects.create(
                        user=user,
                        orden_compra=buy_order,
                        monto_total=result.get('amount', 0),
                        estado='PAGADO'
                    )

                    items_carrito = carrito.items.all()
                    
                    if not items_carrito.exists():
                         raise Exception("Intento de pago de carrito vacío")

                    for item in items_carrito:
                        PedidoItem.objects.create(
                            pedido=nuevo_pedido,
                            producto=item.producto,
                            cantidad=item.cantidad,
                            precio_al_momento_compra=item.producto.precio
                        )
                        
                        producto_a_actualizar = Producto.objects.select_for_update().get(id=item.producto.id)
                        
                        if producto_a_actualizar.stock < item.cantidad:
                            raise Exception(f"Stock insuficiente para {producto_a_actualizar.nombre}")
                        
                        producto_a_actualizar.stock -= item.cantidad
                        producto_a_actualizar.save()
                    
                    items_carrito.delete()

        except Exception as e:
            print(f"Error grave al guardar orden {buy_order}: {str(e)}")
            status = "failed_post_payment"
    
    frontend_url = f"{settings.WEBPAY_FINAL_URL}?status={status}&amount={result.get('amount', 0)}&buy_order={buy_order}"
    
    return HttpResponseRedirect(frontend_url)