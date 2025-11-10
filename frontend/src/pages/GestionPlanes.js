import React, { useState, useEffect, useCallback } from "react";
import API_URL from "../api";

function GestionPlanes() {
  const [planes, setPlanes] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [duracion, setDuracion] = useState(1);
  const [descripcion, setDescripcion] = useState("");

  const token = localStorage.getItem("token");

  // useCallback evita recrear la función en cada render
  const fetchPlanes = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]); // <-- ahora ESLint no da warning

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setNombre(plan.nombre);
    setPrecio(plan.precio);
    setDuracion(plan.duracion_meses);
    setDescripcion(plan.descripcion || "");
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setNombre("");
    setPrecio("");
    setDuracion(1);
    setDescripcion("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nombre,
      precio,
      duracion_meses: duracion,
      descripcion,
    };

    try {
      const url = editingPlan
        ? `${API_URL}/planes/${editingPlan.id}/`
        : `${API_URL}/planes/`;
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPlanes();
        handleCancel();
      } else {
        console.error("Error al guardar plan:", res.status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm("¿Seguro quieres eliminar este plan?")) return;

    try {
      const res = await fetch(`${API_URL}/planes/${planId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPlanes();
      } else {
        console.error("Error al eliminar plan:", res.status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Planes</h1>

      {/* --- Formulario de creación/edición --- */}
      <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 mb-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          {editingPlan ? `Editar Plan: ${editingPlan.nombre}` : "Crear Plan"}
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="p-2 rounded bg-neutral-800 border border-neutral-700"
            required
          />
          <input
            type="number"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="p-2 rounded bg-neutral-800 border border-neutral-700"
            required
          />
          <input
            type="number"
            placeholder="Duración en meses"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="p-2 rounded bg-neutral-800 border border-neutral-700"
            min="1"
            required
          />
          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="p-2 rounded bg-neutral-800 border border-neutral-700 md:col-span-2"
          />
          <div className="md:col-span-2 flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              {editingPlan ? "Guardar Cambios" : "Crear Plan"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* --- Tabla de planes --- */}
      <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 max-w-5xl mx-auto overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-neutral-400 text-sm uppercase tracking-wider border-b border-neutral-800">
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Precio</th>
              <th className="p-4 font-medium">Duración</th>
              <th className="p-4 font-medium">Descripción</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <tr key={plan.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition">
                <td className="p-4">{plan.nombre}</td>
                <td className="p-4">${plan.precio}</td>
                <td className="p-4">{plan.duracion_meses} mes(es)</td>
                <td className="p-4">{plan.descripcion}</td>
                <td className="p-4 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {planes.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-neutral-500 py-4">
                  No hay planes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionPlanes;
