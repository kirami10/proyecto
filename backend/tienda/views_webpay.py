import json
import requests
import time
from django.conf import settings
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# --- AÑADIR IMPORTS ---
from django.contrib.auth.models import User
from .models import Plan, Suscripcion
from django.shortcuts import get_object_or_404
# --- FIN IMPORTS ---


# Credenciales de Integración (Test)
TBK_API_KEY_ID = "597055555532"
TBK_API_KEY_SECRET = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"
TBK_URL_CREATE = "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webpay_create(request):
    """
    1. El Frontend llama aquí para iniciar el pago (PARA EL CARRITO DE COMPRAS).
    """
    try:
        data = request.data
        amount = int(data.get('amount', 1000))
        
        # --- BUY_ORDER MEJORADA (para el carrito) ---
        # FORMATO: CART-USER-USER_ID-TIMESTAMP
        buy_order = f"CART-USER-{request.user.id}-T-{int(time.time())}"
        session_id = f"SES-{int(time.time())}"
        
        return_url = request.build_absolute_uri('/api/webpay/return/')

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
def webpay_return(request):
    """
    2. Transbank devuelve al usuario aquí (POST o GET).
    3. Confirmamos la transacción.
    4. SI ES EXITOSO, guardamos la suscripción/orden.
    5. Redirigimos al Frontend.
    """
    token = request.POST.get("token_ws") or request.GET.get("token_ws")
    
    tbk_token = request.POST.get("TBK_TOKEN") or request.GET.get("TBK_TOKEN")
    if tbk_token and not token:
        frontend_url = f"http://localhost:3000/resultado?status=aborted"
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
        
        # --- INICIO DE LÓGICA DE SUSCRIPCIÓN ---
        try:
            # Evitar procesar la misma orden dos veces
            if not Suscripcion.objects.filter(orden_compra=buy_order).exists():
            
                # A. ¿Es una compra de Plan?
                if buy_order.startswith("PLAN-"):
                    # 'PLAN-PLAN_ID-USER-USER_ID-T-TIMESTAMP'
                    parts = buy_order.split('-')
                    plan_id = parts[1]
                    user_id = parts[3]
                    
                    user = get_object_or_404(User, id=user_id)
                    plan = get_object_or_404(Plan, id=plan_id)
                    
                    # ¡Crear la suscripción!
                    Suscripcion.objects.create(
                        user=user,
                        plan=plan,
                        orden_compra=buy_order
                    )
                
                # B. ¿Es una compra de Carrito? (Lógica futura)
                elif buy_order.startswith("CART-"):
                    # Aquí iría la lógica para crear un Pedido
                    # y descontar stock de Productos.
                    print(f"Compra de carrito {buy_order} exitosa. (Lógica no implementada)")

        except Exception as e:
            # Si algo falla al guardar la orden, el pago está hecho
            # pero deberíamos loguearlo para revisión manual.
            print(f"Error grave al guardar orden {buy_order}: {str(e)}")
            status = "failed_post_payment"
        # --- FIN DE LÓGICA DE SUSCRIPCIÓN ---
    
    # Redirigir al Frontend
    frontend_url = f"http://localhost:3000/resultado?status={status}&amount={result.get('amount', 0)}&buy_order={buy_order}"
    
    return HttpResponseRedirect(frontend_url)