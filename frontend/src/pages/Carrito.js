import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../AuthContext";
import toast from 'react-hot-toast'; // <-- AÑADIR IMPORT

// --- Helpers de Formato ---
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};

function Carrito() {
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, itemCount, totalPrice } = useCart();
  const { authToken, user } = useAuth(); 
  const navigate = useNavigate(); 

  useEffect(() => {
    const inProgress = sessionStorage.getItem('webpay_in_progress');
    if (inProgress === 'true') {
      sessionStorage.removeItem('webpay_in_progress');
      navigate('/resultado?status=aborted_by_user');
    }
  }, [navigate]);


  const handlePago = async () => {
    if (!authToken || !user?.user_id) {
      toast.error("No estás autenticado. Por favor, inicia sesión."); // <-- MODIFICADO
      return;
    }
    
    const buy_order = `C${user.user_id}T${Math.floor(Date.now() / 1000)}`;
    const return_url = "http://127.0.0.1:8000/api/webpay/return/"; 

    // --- AÑADIDO: toast.loading ---
    const loadingToast = toast.loading('Conectando con Webpay...');
    // --- FIN ADICIÓN ---

    try {
      const response = await fetch("http://127.0.0.1:8000/api/webpay/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: totalPrice,
          session_id: `C${user.user_id}T${Math.floor(Date.now() / 1000)}`,
          buy_order: buy_order,
          return_url: return_url, 
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        toast.dismiss(loadingToast); // <-- Cerramos el toast
        console.error("Respuesta no válida del backend:", text);
        toast.error("Error en la respuesta del servidor."); // <-- MODIFICADO
        return;
      }

      toast.dismiss(loadingToast); // <-- Cerramos el toast

      if (response.ok && data.url && data.token) {
        sessionStorage.setItem('webpay_in_progress', 'true');
        
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.url;
        const tokenInput = document.createElement("input");
        tokenInput.type = "hidden";
        tokenInput.name = "token_ws";
        tokenInput.value = data.token;
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
      } else {
        toast.error("No se pudo iniciar la transacción con Webpay."); // <-- MODIFICADO
        console.error("Error en respuesta de Webpay:", data);
      }
    } catch (error) {
      toast.dismiss(loadingToast); // <-- Cerramos el toast si hay error
      console.error("Error al conectar con el backend:", error);
      toast.error("Error al conectar con el servidor."); // <-- MODIFICADO
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-neutral-400 mb-8">Parece que aún no has añadido productos.</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tu Carrito</h1>
          <button onClick={() => clearCart(true)} className="text-sm text-neutral-400 hover:text-red-500 transition">
            Vaciar Carrito
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna de Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg">
                <img
                  src={getImageUrl(item.imagen_producto) || "https://placehold.co/100x100/374151/9ca3af?text=N/A"}
                  alt={item.nombre_producto}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                />
                <div className="flex-1 ml-4">
                  <h3 className="text-lg font-semibold">{item.nombre_producto}</h3>
                  <p className="text-sm text-neutral-400">${formatCLP(item.precio_producto)} c/u</p>
                </div>
                <div className="flex items-center gap-2 border border-neutral-700 rounded-lg p-1">
                  <button
                    onClick={() => decreaseQuantity(item)}
                    className="px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold">{item.cantidad}</span>
                  <button
                    onClick={() => increaseQuantity(item)}
                    className="px-2 py-1 rounded hover:bg-neutral-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="font-bold text-lg w-24 text-right">
                    ${formatCLP(item.subtotal)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item)}
                    className="text-xs text-red-500 hover:text-red-400 mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Columna de Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-6 sticky top-28">
              <h2 className="text-2xl font-semibold border-b border-neutral-700 pb-4 mb-4">Resumen de Compra</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-neutral-300">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium">${formatCLP(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Envío</span>
                  <span className="font-medium">Gratis</span>
                </div>
                <div className="border-t border-neutral-700 pt-4 mt-4">
                  <div className="flex justify-between text-white text-xl font-bold">
                    <span>Total</span>
                    <span>${formatCLP(totalPrice)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handlePago}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Carrito;