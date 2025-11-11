// src/pages/PlanesCliente.js
import React, { useState, useEffect } from "react";
import API_URL from "../api";

function PlanesCliente() {
  const [planes, setPlanes] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const res = await fetch(`${API_URL}/planes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPlanes(data);
        } else {
          console.error("Error al traer planes:", res.status);
        }
      } catch (err) {
        console.error("Error de red:", err);
      }
    };
    fetchPlanes();
  }, [token]);

  const comprarPlan = async (planId) => {
    // Aquí puedes implementar la lógica de compra, por ejemplo POST a un endpoint de suscripciones
    alert(`Has comprado el plan con id: ${planId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Planes Disponibles</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">{plan.nombre}</h2>
              <p className="mb-1">Precio: ${plan.precio}</p>
              <p className="mb-1">Duración: {plan.duracion_meses} mes(es)</p>
              <p className="text-neutral-400">{plan.descripcion}</p>
            </div>
            <button
              onClick={() => comprarPlan(plan.id)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Comprar
            </button>
          </div>
        ))}
        {planes.length === 0 && (
          <p className="text-center col-span-full text-neutral-500">
            No hay planes disponibles
          </p>
        )}
      </div>
    </div>
  );
}

export default PlanesCliente;