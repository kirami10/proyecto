import React, { useState, useEffect } from "react";
import API_URL from "../api";
import toast from 'react-hot-toast';
import { useAuth } from "../AuthContext";

// Helper para fecha
const formatFecha = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("es-CL");
};

function GestionNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del Formulario
  const [editingId, setEditingId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("info");

  const { authToken } = useAuth();

  // Cargar notificaciones
  const fetchNotificaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/notificaciones/`, {
          headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  // Manejar Crear o Actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingId ? "Actualizando..." : "Enviando...");
    
    const url = editingId 
        ? `${API_URL}/notificaciones/${editingId}/`
        : `${API_URL}/notificaciones/`;
    
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ titulo, mensaje, tipo }),
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success(editingId ? "Notificación actualizada" : "Notificación enviada");
        resetForm();
        fetchNotificaciones();
      } else {
        toast.error("Error al guardar");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error de conexión");
    }
  };

  // Manejar Borrar
  const handleDelete = async (id) => {
      if(!window.confirm("¿Seguro que quieres eliminar esta notificación?")) return;
      
      try {
          const res = await fetch(`${API_URL}/notificaciones/${id}/`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${authToken}` }
          });
          if (res.ok) {
              toast.success("Notificación eliminada");
              fetchNotificaciones();
          }
      } catch (err) {
          toast.error("Error al eliminar");
      }
  };

  // Cargar datos para editar
  const handleEdit = (notif) => {
      setEditingId(notif.id);
      setTitulo(notif.titulo);
      setMensaje(notif.mensaje);
      setTipo(notif.tipo);
      window.scrollTo(0, 0); // Subir al formulario
  };

  const resetForm = () => {
      setEditingId(null);
      setTitulo("");
      setMensaje("");
      setTipo("info");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Notificaciones</h1>

        {/* --- FORMULARIO --- */}
        <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
                {editingId ? "Editar Notificación" : "Nueva Notificación"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-neutral-400 text-sm mb-2">Tipo</label>
                    <div className="flex gap-2">
                        {['info', 'alerta', 'exito'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTipo(t)}
                                className={`flex-1 py-2 rounded border text-sm font-medium transition ${
                                    tipo === t 
                                    ? (t === 'alerta' ? 'bg-red-900/40 border-red-500 text-red-400' : t === 'exito' ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-blue-900/40 border-blue-500 text-blue-400')
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                                }`}
                            >
                                {t === 'info' ? 'ℹ️ Info' : t === 'alerta' ? '⚠️ Alerta' : '✅ Aviso'}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <input
                        type="text"
                        className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded focus:border-blue-500 text-white"
                        placeholder="Título"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <textarea
                        className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded focus:border-blue-500 text-white h-24 resize-none"
                        placeholder="Mensaje..."
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        required
                    />
                </div>
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold">
                        {editingId ? "Actualizar" : "Enviar"}
                    </button>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="px-4 bg-neutral-700 hover:bg-neutral-600 rounded">
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>

        {/* --- LISTA --- */}
        <div className="space-y-4">
            {notificaciones.map((notif) => (
                <div key={notif.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-start hover:bg-neutral-800/50 transition">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{notif.tipo === 'alerta' ? '⚠️' : notif.tipo === 'exito' ? '✅' : 'ℹ️'}</span>
                            <h3 className="font-bold text-white">{notif.titulo}</h3>
                        </div>
                        <p className="text-neutral-400 text-sm mb-2">{notif.mensaje}</p>
                        <p className="text-xs text-neutral-600">{formatFecha(notif.creado_en)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => handleEdit(notif)} className="text-blue-500 hover:text-blue-400 text-sm">Editar</button>
                        <button onClick={() => handleDelete(notif.id)} className="text-red-500 hover:text-red-400 text-sm">Borrar</button>
                    </div>
                </div>
            ))}
            {notificaciones.length === 0 && !loading && <p className="text-center text-neutral-500">No hay notificaciones.</p>}
        </div>

      </div>
    </div>
  );
}

export default GestionNotificaciones;