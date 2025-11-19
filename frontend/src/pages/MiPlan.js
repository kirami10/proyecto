import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api"; 
import { useAuth } from "../AuthContext"; 

// --- Helpers ---
const formatFecha = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-CL", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

function MiPlan() {
  const [miPlan, setMiPlan] = useState(null); // Plan Activo
  const [historial, setHistorial] = useState([]); // Lista de historial
  const [loading, setLoading] = useState(true);
  const { authToken } = useAuth(); 

  // Cargar Plan Activo
  const fetchMiPlan = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/mi-plan/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.ok) {
          const data = await response.json();
          setMiPlan(data); 
      }
    } catch (error) {
      console.error("Error fetching active plan:", error);
    }
  }, [authToken]);

  // Cargar Historial Completo
  const fetchHistorial = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/historial-planes/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.ok) {
          const data = await response.json();
          setHistorial(data); 
      }
    } catch (error) {
      console.error("Error fetching historial:", error);
    }
  }, [authToken]);


  useEffect(() => {
    if (authToken) {
        setLoading(true);
        Promise.all([fetchMiPlan(), fetchHistorial()])
            .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [authToken, fetchMiPlan, fetchHistorial]); 

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white text-xl">Cargando información...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        
        {/* --- SECCIÓN 1: ESTADO ACTUAL (MEMBRESÍA) --- */}
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">Estado de tu Membresía</h1>
        
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl text-center mb-12">
            {miPlan && miPlan.plan ? (
              <div>
                <h2 className="text-3xl text-white font-bold mb-2">{miPlan.plan.nombre}</h2>
                
                {/* --- AÑADIDO: Descripción del Plan Activo --- */}
                <p className="text-neutral-400 mb-4 max-w-lg mx-auto italic">
                    {miPlan.plan.descripcion || "Sin descripción"}
                </p>
                {/* --- FIN AÑADIDO --- */}

                <div className="inline-block bg-green-900/30 border border-green-600 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-6">
                    PLAN ACTIVO
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-lg mx-auto bg-neutral-800/50 p-6 rounded-xl">
                    <div>
                        <p className="text-neutral-500 text-xs uppercase tracking-wide font-semibold">Fecha Inicio</p>
                        <p className="text-white font-medium">{formatFecha(miPlan.fecha_inicio)}</p>
                    </div>
                    <div>
                        <p className="text-neutral-500 text-xs uppercase tracking-wide font-semibold">Fecha Vencimiento</p>
                        <p className="text-white font-medium">{formatFecha(miPlan.fecha_vencimiento)}</p>
                    </div>
                    <div className="sm:col-span-2 border-t border-neutral-700 pt-4 mt-2">
                        <p className="text-neutral-500 text-xs uppercase tracking-wide font-semibold">Orden de Compra</p>
                        <p className="text-neutral-300 font-mono text-sm">{miPlan.orden_compra || "N/A"}</p>
                    </div>
                </div>

              </div>
            ) : (
              <div className="py-6">
                <p className="text-xl text-neutral-300 mb-6">
                  Actualmente no tienes un plan activo.
                </p>
                <Link
                  to="/planes"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg shadow-blue-900/20"
                >
                  Ver Planes Disponibles
                </Link>
              </div>
            )}
        </div>

        {/* --- SECCIÓN 2: HISTORIAL DE PLANES --- */}
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-neutral-800 pb-4">
            Historial de Suscripciones
        </h2>

        {historial.length > 0 ? (
          <div className="space-y-4">
            {historial.map((sub) => (
              <div key={sub.id} className={`bg-neutral-900 border rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${sub.activa ? 'border-blue-500/50 bg-blue-900/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                
                {/* Info Izquierda */}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{sub.plan.nombre}</h3>
                        {sub.activa ? (
                             <span className="text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/50 bg-blue-900/20">ACTUAL</span>
                        ) : (
                            <span className="text-neutral-500 text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800">FINALIZADO</span>
                        )}
                    </div>
                    
                    {/* --- AÑADIDO: Descripción en el historial --- */}
                    <p className="text-neutral-500 text-sm mb-1 italic">
                        {sub.plan.descripcion}
                    </p>
                    {/* --- FIN AÑADIDO --- */}

                    <p className="text-neutral-500 text-xs font-mono">Orden: {sub.orden_compra || "N/A"}</p>
                </div>

                {/* Info Derecha (Fechas y Precio) */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-neutral-300 w-full md:w-auto">
                    <div>
                        <span className="text-neutral-500 block text-xs">Vencimiento:</span>
                        {formatFecha(sub.fecha_vencimiento)}
                    </div>
                    <div className="text-right">
                        <span className="text-neutral-500 block text-xs">Precio:</span>
                        <span className="text-white font-bold">${formatCLP(sub.plan.precio)}</span>
                    </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-500 py-8 bg-neutral-900 rounded-xl border border-neutral-800">
            No hay historial de suscripciones disponible.
          </div>
        )}

      </div>
    </div>
  );
}

export default MiPlan;