import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import API_URL from "../api"; // Lo necesitarás cuando conectes el backend

function MiPlan() {
  const [miPlan, setMiPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  // const token = localStorage.getItem("token");

  useEffect(() => {
    // --- NOTA IMPORTANTE ---
    // Esta función necesita un endpoint en tu backend (ej: /api/mi-suscripcion/)
    // que devuelva el plan activo del usuario logueado.
    // Como tu backend aún no lo implementa, simulamos que el usuario NO tiene plan.
    const fetchMiPlan = async () => {
      setLoading(true);
      
      // *** INICIO SIMULACIÓN ***
      // Cuando tengas el backend, reemplazarás esto:
      // const response = await fetch(`${API_URL}/mi-suscripcion/`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setMiPlan(data);
      setMiPlan(null); // Simulamos que el usuario no tiene plan
      setLoading(false);
      // *** FIN SIMULACIÓN ***
    };

    fetchMiPlan();
  }, []); // El token se puede añadir como dependencia si se usa

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white text-xl">Cargando tu plan...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl max-w-lg text-center">
        <h1 className="text-3xl font-bold text-blue-400 mb-6">Estado de tu Membresía</h1>

        {miPlan ? (
          <div>
            <h2 className="text-2xl text-white font-semibold">{miPlan.nombre}</h2>
            <p className="text-lg text-neutral-400 mt-2">Vence el: {miPlan.fecha_vencimiento}</p>
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