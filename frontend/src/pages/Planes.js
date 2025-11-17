import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import { useAuth } from "../AuthContext";
import toast from 'react-hot-toast'; // <-- AÑADIR IMPORT

// Helper para formato CLP
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

const formatFecha = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-CL", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
};

// Tarjeta de Plan individual
const PlanCard = ({ plan, onComenzar, planActivo }) => { 
  
  const tieneEstePlan = planActivo && planActivo.plan.id === plan.id;

  const handleBotonClick = () => {
    if (planActivo) {
        // --- MODIFICADO: Usamos toast ---
        const fechaVencimiento = formatFecha(planActivo.fecha_vencimiento);
        toast.error(
          `Ya tienes un plan activo: "${planActivo.plan.nombre}".\nVence el: ${fechaVencimiento}.`,
          { duration: 4000 }
        );
        // --- FIN MODIFICACIÓN ---
    } else {
        onComenzar(plan.id);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl shadow-lg overflow-hidden bg-neutral-800 border ${tieneEstePlan ? 'border-blue-500' : 'border-neutral-700/50'} transform transition-all duration-300 ${!planActivo ? 'hover:scale-[1.03] hover:shadow-blue-900/20' : ''}`}>
      {tieneEstePlan && (
        <div className="bg-blue-600 text-center text-white text-sm font-bold p-2">
            Plan Actual
        </div>
      )}
      <div className="p-8">
        <h3 className="text-2xl font-bold text-blue-400 text-center mb-2">{plan.nombre}</h3>
        <p className="text-center text-neutral-400 h-12 mb-4">{plan.descripcion || "Plan estándar"}</p>
        <div className="text-center my-6">
          <span className="text-5xl font-extrabold text-white">${formatCLP(plan.precio)}</span>
          <span className="text-neutral-400">/ {plan.duracion_meses} {plan.duracion_meses > 1 ? 'meses' : 'mes'}</span>
        </div>
        
        <button
          onClick={handleBotonClick}
          disabled={planActivo && !tieneEstePlan} 
          className={`block w-full text-center text-white font-semibold py-3 rounded-lg transition ${
            planActivo 
              ? (tieneEstePlan ? 'bg-blue-800 cursor-default' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed') 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {planActivo 
            ? (tieneEstePlan ? 'Ya tienes este plan' : 'Plan no disponible') 
            : 'Comenzar Ahora'}
        </button>

      </div>
    </div>
  );
};

// Componente Principal
function Planes() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { authToken } = useAuth();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);

  const fetchActivePlan = useCallback(async () => {
    if (!authToken) {
        return;
    }
    try {
      const response = await fetch(`${API_URL}/mi-plan/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActivePlan(data);
      }
    } catch (error) {
      console.error("Error fetching active plan:", error);
    }
  }, [authToken]);

  const fetchPlanes = useCallback(async () => {
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
  }, []); 

  useEffect(() => {
    setLoading(true);
    Promise.all([
        fetchPlanes(),
        fetchActivePlan()
    ]).finally(() => {
        setLoading(false);
    });
  }, [fetchPlanes, fetchActivePlan]);


  const handleComenzar = (planId) => {
    if (authToken) {
      navigate(`/comprar-plan/${planId}`);
    } else {
      localStorage.setItem('pendingPlanId', planId);
      navigate("/login");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white text-xl">Cargando planes...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-4">Elige tu Plan</h1>
        <p className="text-neutral-400 text-center text-lg mb-12">
          {activePlan 
            ? `Ya tienes una membresía activa. Vence el ${formatFecha(activePlan.fecha_vencimiento)}.`
            : "Comienza hoy mismo a transformar tu cuerpo y tu vida."
          }
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planes.length > 0 ? (
            planes.map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                onComenzar={handleComenzar}
                planActivo={activePlan}
              />
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