import React, { useState, useEffect, useCallback } from "react";
import API_URL from "../api";

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [numeroPersonal, setNumeroPersonal] = useState("");
  const [numeroEmergencia, setNumeroEmergencia] = useState("");
  const [activo, setActivo] = useState(true);

  const token = localStorage.getItem("token");

  // --- fetchUsuarios con useCallback para no disparar warning ---
  const fetchUsuarios = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        console.error("Error al traer usuarios:", response.status);
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleEdit = (user) => {
    setEditingUser(user);
    setNombre(user.nombre || "");
    setApellidos(user.apellidos || "");
    setEmail(user.email || "");
    setNumeroPersonal(user.numero_personal || "");
    setNumeroEmergencia(user.numero_emergencia || "");
    setActivo(user.activo); // Cargar estado actual
  };

  const handleCancel = () => {
    setEditingUser(null);
    setNombre("");
    setApellidos("");
    setEmail("");
    setNumeroPersonal("");
    setNumeroEmergencia("");
    setActivo(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload = {
      nombre,
      apellidos,
      email,
      numero_personal: numeroPersonal,
      numero_emergencia: numeroEmergencia,
      is_active: activo, // Enviar al backend
    };

    try {
      const response = await fetch(`${API_URL}/usuarios/${editingUser.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchUsuarios();
        handleCancel();
      } else {
        console.error("Error al actualizar usuario:", response.status);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Usuarios</h1>

      {/* --- Formulario de edición --- */}
      {editingUser && (
        <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 mb-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Editar Usuario: {editingUser.username}</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="p-2 rounded bg-neutral-800 border border-neutral-700"
              required
            />
            <input
              placeholder="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="p-2 rounded bg-neutral-800 border border-neutral-700"
              required
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 rounded bg-neutral-800 border border-neutral-700"
              required
            />
            <input
              placeholder="Número Personal"
              value={numeroPersonal}
              onChange={(e) => setNumeroPersonal(e.target.value)}
              className="p-2 rounded bg-neutral-800 border border-neutral-700"
            />
            <input
              placeholder="Número Emergencia"
              value={numeroEmergencia}
              onChange={(e) => setNumeroEmergencia(e.target.value)}
              className="p-2 rounded bg-neutral-800 border border-neutral-700"
            />

            {/* Checkbox para activar/desactivar */}
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                id="activo"
              />
              <label htmlFor="activo">Activo</label>
            </div>

            <div className="md:col-span-2 flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Guardar Cambios
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
      )}

      {/* --- Tabla de usuarios --- */}
      <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 max-w-5xl mx-auto overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-neutral-400 text-sm uppercase tracking-wider border-b border-neutral-800">
              <th className="p-4 font-medium">Username</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium text-center">Activo</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition">
                <td className="p-4">{user.username}</td>
                <td className="p-4">{user.nombre} {user.apellidos}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4 text-center">{user.activo ? "Sí" : "No"}</td>
                <td className="p-4 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-neutral-500 py-4">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionUsuarios;
