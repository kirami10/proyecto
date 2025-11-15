# tienda/views_webpay.py
import requests
import time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST"])
def webpay_create(request):
    """
    Crea una transacción Webpay Plus en ambiente de integración/prueba.
    """
    try:
        # Parsear el body
        data = json.loads(request.body)
        amount = int(data.get('amount', 1000))
        buy_order = data.get('buy_order', f"ORD{int(time.time())}")
        session_id = data.get('session_id', f"SES{int(time.time())}")
        return_url = data.get('return_url', 'http://localhost:3000/webpay/return')

        # Configuración Webpay
        url = "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions"
        
        headers = {
            "Tbk-Api-Key-Id": "597055555532",
            "Tbk-Api-Key-Secret": "579B532A7440BB0C9079DED94D31EA161EB9A7DC7A6F74E5BC78E89F0C1F9D65",
            "Content-Type": "application/json",
        }

        payload = {
            "buy_order": buy_order,
            "session_id": session_id,
            "amount": amount,
            "return_url": return_url,
        }

        print(f"🚀 Creando transacción: {payload}")

        # Llamar a Transbank
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        resp_data = response.json()

        print(f"📥 Respuesta Transbank ({response.status_code}): {resp_data}")

        if response.status_code == 200 and "token" in resp_data:
            return JsonResponse({
                "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
                "token": resp_data["token"]
            })
        else:
            return JsonResponse({
                "error": "Error al crear transacción",
                "details": resp_data
            }, status=response.status_code)

    except Exception as e:
        print(f"❌ Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)