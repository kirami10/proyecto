import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import API_URL from "../api";

// Helper para formato CLP
const formatCLP = (value) => {
  if (value === null || value === undefined) value = 0;
  const cleanValue = (value).toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

function ComprarPlan() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- MODIFICADO ---
  const { authToken, user } = useAuth(); // Obtenemos 'user' del contexto
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/planes/${planId}/`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        } else {
          console.error("No se pudo cargar el plan");
          navigate("/planes");
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchPlan();
  }, [planId, navigate]);

  const handlePago = async () => {
    // --- MODIFICADO ---
    if (!authToken || !plan || !user?.user_id) {
        alert("No se pudo obtener tu ID de usuario. Por favor, vuelve a iniciar sesión.");
        return;
    }

    // Creamos una orden de compra única y parsable
    // FORMATO: PLAN-PLAN_ID-USER-USER_ID-TIMESTAMP
    const buy_order = `PLAN-${plan.id}-USER-${user.user_id}-T-${Date.now()}`;
    // --- FIN MODIFICACIÓN ---

    try {
      const response = await fetch("http://127.0.0.1:8000/api/webpay/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: parseInt(plan.precio), // El precio del plan
          session_id: "session_plan_" + plan.id,
          buy_order: buy_order, // <--- USAMOS LA NUEVA BUY_ORDER
          return_url: "http://127.0.0.1:8000/api/webpay/return/",
        }),
      });

      const data = await response.json();

      if (response.ok && data.url && data.token) {
        sessionStorage.setItem('webpay_in_progress', 'true');
        // Redirige al formulario de Webpay
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
    }
  };

  if (loading || !plan) {
    return <div className="min-h-screen flex items-center justify-center text-white">Cargando plan...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl max-w-lg w-full">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">Confirmar Compra</h1>
        
        <div className="bg-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl text-white font-semibold mb-2">{plan.nombre}</h2>
          <p className="text-neutral-400 mb-4">{plan.descripcion || "Plan sin descripción"}</p>
          <div className="border-t border-neutral-700 pt-4">
            <div className="flex justify-between text-white text-xl font-bold">
              <span>Total a Pagar:</span>
              <span>${formatCLP(plan.precio)}</span>
            </div>
            <p className="text-neutral-500 text-sm text-right">
              Duración: {plan.duracion_meses} {plan.duracion_meses > 1 ? 'meses' : 'mes'}
            </p>
          </div>
        </div>

        <button
          onClick={handlePago}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
        >
          Proceder al Pago con Webpay
        </button>
      </div>
    </div>
  );
}

export default ComprarPlan;