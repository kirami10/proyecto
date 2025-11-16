import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // <-- CAMBIADO DE Link
import API_URL from "../api";
import { useAuth } from "../AuthContext"; // <-- AÑADIDO

// Helper para formato CLP
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

// Tarjeta de Plan individual
const PlanCard = ({ plan, onComenzar }) => { // <-- AÑADIDO onComenzar
  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-neutral-800 border border-neutral-700/50 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-blue-900/20">
      <div className="p-8">
        <h3 className="text-2xl font-bold text-blue-400 text-center mb-2">{plan.nombre}</h3>
        <p className="text-center text-neutral-400 h-12 mb-4">{plan.descripcion || "Plan estándar"}</p>
        <div className="text-center my-6">
          <span className="text-5xl font-extrabold text-white">${formatCLP(plan.precio)}</span>
          <span className="text-neutral-400">/ {plan.duracion_meses} {plan.duracion_meses > 1 ? 'meses' : 'mes'}</span>
        </div>
        
        {/* --- ESTE BOTÓN FUE MODIFICADO --- */}
        <button
          onClick={() => onComenzar(plan.id)}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Comenzar Ahora
        </button>
        {/* --- FIN DE LA MODIFICACIÓN --- */}

      </div>
    </div>
  );
};

// Componente Principal
function Planes() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { authToken } = useAuth(); // <-- AÑADIDO
  const navigate = useNavigate(); // <-- AÑADIDO

  const fetchPlanes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/planes/`);
      if (res.ok) {
        const data = await res.json();
        setPlanes(data);
      } else {
        console.error("Error al traer planes");
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  // --- AÑADIDA ESTA LÓGICA ---
  const handleComenzar = (planId) => {
    if (authToken) {
      // Si está logueado, va directo a la página de compra
      navigate(`/comprar-plan/${planId}`);
    } else {
      // Si NO está logueado:
      // 1. Guardamos el plan que quiere en localStorage
      localStorage.setItem('pendingPlanId', planId);
      // 2. Lo mandamos a Iniciar Sesión
      navigate("/login");
    }
  };
  // --- FIN DE LA LÓGICA AÑADIDA ---

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white text-xl">Cargando planes...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-4">Elige tu Plan</h1>
        <p className="text-neutral-400 text-center text-lg mb-12">
          Comienza hoy mismo a transformar tu cuerpo y tu vida.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planes.length > 0 ? (
            planes.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onComenzar={handleComenzar} /> // <-- MODIFICADO
            ))
          ) : (
            <p className="text-center col-span-3 text-neutral-500">No hay planes disponibles en este momento.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Planes;