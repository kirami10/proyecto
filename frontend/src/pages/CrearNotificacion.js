import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import toast from 'react-hot-toast';
import { useAuth } from "../AuthContext";

function CrearNotificacion() {
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("info");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { authToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Enviando notificación...");

    try {
      const response = await fetch(`${API_URL}/notificaciones/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ titulo, mensaje, tipo }),
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success("Notificación enviada a los clientes");
        navigate("/"); // Volver al inicio
      } else {
        toast.error("Error al enviar");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Crear Notificación</h1>

        <div className="bg-neutral-900 p-8 rounded-xl shadow-lg border border-neutral-800">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tipo de Notificación */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-2 font-medium">Tipo de Aviso</label>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => setTipo('info')}
                            className={`p-3 rounded-lg border text-center transition ${tipo === 'info' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                            ℹ️ Información
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo('alerta')}
                            className={`p-3 rounded-lg border text-center transition ${tipo === 'alerta' ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                            ⚠️ Alerta
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo('exito')}
                            className={`p-3 rounded-lg border text-center transition ${tipo === 'exito' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                            ✅ Aviso/Evento
                        </button>
                    </div>
                </div>

                {/* Título */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-2 font-medium">Título</label>
                    <input
                        type="text"
                        className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition text-white"
                        placeholder="Ej: Mantenimiento de máquinas"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />
                </div>

                {/* Mensaje */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-2 font-medium">Mensaje</label>
                    <textarea
                        className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none h-32 text-white"
                        placeholder="Detalles para el cliente..."
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition shadow-lg disabled:opacity-50"
                >
                    {loading ? "Enviando..." : "Enviar Notificación"}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
}

export default CrearNotificacion;