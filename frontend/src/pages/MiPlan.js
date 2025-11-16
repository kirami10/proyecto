import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api"; // <-- Lo necesitamos
import { useAuth } from "../AuthContext"; // <-- Lo necesitamos

// Helper para formatear fechas
const formatFecha = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-CL", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function MiPlan() {
  const [miPlan, setMiPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authToken } = useAuth(); // Usamos el token del contexto

  useEffect(() => {
    // Ya no simulamos, hacemos el fetch real
    const fetchMiPlan = async () => {
      setLoading(true);
      
      if (!authToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/mi-plan/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            setMiPlan(data); // data será 'null' o el objeto suscripción
        } else {
            console.error("Error al cargar el plan");
        }
      } catch (error) {
        console.error("Error de red:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMiPlan();
  }, [authToken]); // Se ejecuta cuando el token esté disponible

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white text-xl">Cargando tu plan...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl max-w-lg text-center">
        <h1 className="text-3xl font-bold text-blue-400 mb-6">Estado de tu Membresía</h1>

        {miPlan && miPlan.plan ? ( // <--- MODIFICADO (ahora miPlan es el objeto suscripción)
          <div>
            <h2 className="text-2xl text-white font-semibold">{miPlan.plan.nombre}</h2>
            <p className="text-lg text-neutral-300 mt-2">
              Vence el: <span className="font-bold">{formatFecha(miPlan.fecha_vencimiento)}</span>
            </p>
            <p className="text-sm text-green-400 font-medium mt-4">MEMBRESÍA ACTIVA</p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-neutral-300 mb-6">
              Actualmente no tienes un plan activo.
            </p>
            <Link
              to="/planes"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Ver Planes Disponibles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiPlan;