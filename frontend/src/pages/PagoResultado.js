import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function PagoResultado() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const amount = searchParams.get("amount");
  const buyOrder = searchParams.get("buy_order");
  const { clearCart } = useCart();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // --- AÑADIDO: Limpiamos la bandera de "pago en proceso" ---
    // Ya sea éxito o fracaso, si llegamos aquí, el proceso terminó.
    sessionStorage.removeItem('webpay_in_progress');
    // --- FIN DE LÍNEA AÑADIDA ---

    if (status === "success" && !processed) {
      // Si el pago fue exitoso, limpiamos el carrito (sin confirmación)
      clearCart(false); 
      setProcessed(true);
    }
  }, [status, clearCart, processed]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="bg-neutral-900 p-8 rounded-xl shadow-2xl border border-neutral-800 max-w-md w-full text-center">
        {status === "success" ? (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
            <p className="text-neutral-400 mb-6">Tu compra ha sido procesada correctamente.</p>
            
            <div className="bg-neutral-800 rounded-lg p-4 mb-6 text-left text-sm">
              <p className="flex justify-between mb-2">
                <span className="text-neutral-500">Orden:</span>
                <span className="font-mono">{buyOrder}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-neutral-500">Monto:</span>
                <span className="font-bold text-green-400">${parseInt(amount || 0).toLocaleString('es-CL')}</span>
              </p>
            </div>

            <Link to="/profile" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
              Ver mis Pedidos
            </Link>
          </>
        ) : (
          <>
             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Pago Fallido</h1>
            <p className="text-neutral-400 mb-6">
              {status === "aborted" || status === "aborted_by_user" 
                ? "Has anulado o abandonado la compra." 
                : "Hubo un problema al procesar tu pago."}
            </p>
            
            <Link to="/carrito" className="block w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 rounded-lg transition">
              Volver al Carrito
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default PagoResultado;