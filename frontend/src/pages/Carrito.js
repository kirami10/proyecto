import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../AuthContext"; // ✅ Add this import

// --- Helpers de Formato (copiados de Home.js) ---
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http")
    ? path
    : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};

function Carrito() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    itemCount,
    totalPrice,
  } = useCart();

  const { authToken } = useAuth(); // ✅ Get the auth token

  // --- FUNCIÓN PARA PAGAR CON WEBPAY ---
  const handlePago = async () => {
    // ✅ Debug: Check if token exists
    console.log("Auth Token:", authToken);
    
    if (!authToken) {
      alert("No estás autenticado. Por favor inicia sesión.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/webpay/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`, // ✅ Add the token here
        },
        body: JSON.stringify({
          amount: totalPrice,
          session_id: "session_" + Math.floor(Math.random() * 1000000),
          buy_order: "order_" + Math.floor(Math.random() * 1000000),
          return_url: "http://localhost:3000/webpay/return",
        }),
      });

      // Manejo seguro por si la respuesta no es JSON
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Respuesta no válida del backend:", text);
        alert("Error en la respuesta del servidor. Revisa la consola.");
        return;
      }

      console.log("Respuesta del backend:", data);

      if (response.ok && data.url && data.token) {
        // Redirige al formulario de Webpay automáticamente
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
        alert("No se pudo iniciar la transacción con Webpay.");
        console.error("Error en respuesta de Webpay:", data);
      }
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-neutral-400 mb-8">
            Parece que aún no has añadido productos.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
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
          <button
            onClick={clearCart}
            className="text-sm text-neutral-400 hover:text-red-500 transition"
          >
            Vaciar Carrito
          </button>
        </div>

        {/* Layout de Carrito (Lista y Resumen) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna de Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg"
              >
                {/* Imagen */}
                <img
                  src={
                    getImageUrl(item.imagen) ||
                    "https://placehold.co/100x100/374151/9ca3af?text=N/A"
                  }
                  alt={item.nombre}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                />

                {/* Info */}
                <div className="flex-1 ml-4">
                  <h3 className="text-lg font-semibold text-white">
                    {item.nombre}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    ${formatCLP(item.precio)} c/u
                  </p>
                </div>

                {/* Controles de Cantidad */}
                <div className="flex items-center gap-2 border border-neutral-700 rounded-lg p-1">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50"
                    disabled={item.quantity === 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increaseQuantity(item.id)}
                    className="px-2 py-1 rounded hover:bg-neutral-700"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal y Eliminar */}
                <div className="flex flex-col items-end ml-4">
                  <span className="font-bold text-lg w-24 text-right">
                    ${formatCLP(item.precio * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-red-500 hover:text-red-400 mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Columna de Resumen (Total) */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-6 sticky top-28">
              <h2 className="text-2xl font-semibold border-b border-neutral-700 pb-4 mb-4">
                Resumen de Compra
              </h2>
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