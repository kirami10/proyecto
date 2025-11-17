import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api"; 
import { useAuth } from "../AuthContext";
import toast from 'react-hot-toast'; 

// --- Helpers de Formato (sin cambios) ---
const formatFecha = (isoString, includeTime = false) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString("es-CL", options);
};
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};
const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};
// --- Fin Helpers ---

// --- Componente Principal ---
function HistorialPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authToken } = useAuth(); 

  const fetchPedidos = useCallback(async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/historial-pedidos/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPedidos(data);
      }
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // --- MODIFICADO: Función de descarga con mejor manejo de errores ---
  const handleDescargarBoleta = async (pedidoId) => {
    const loadingToast = toast.loading('Generando boleta...');
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/pedido/${pedidoId}/boleta/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`, 
        },
      });

      if (!response.ok) {
        // --- INICIO DE LA MODIFICACIÓN ---
        // Si la respuesta no es OK, intentamos leerla como JSON.
        try {
          const errData = await response.json();
          // Si es JSON y tiene 'error', lo mostramos
          throw new Error(errData.error || 'No se pudo descargar la boleta');
        } catch (jsonError) {
          // Si falla (porque es HTML), mostramos un error genérico
          // y registramos el HTML en la consola para depuración.
          const errorText = await response.text();
          console.error("Error no-JSON del backend:", errorText);
          throw new Error('Error del servidor al generar el PDF');
        }
        // --- FIN DE LA MODIFICACIÓN ---
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta-pedido-${pedidoId}.pdf`; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success('Boleta descargada');

    } catch (error) {
      console.error('Error al descargar:', error);
      toast.dismiss(loadingToast);
      // Usamos error.message, que ahora será más limpio
      toast.error(`Error al generar la boleta: ${error.message}`);
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <p className="text-white text-xl">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-neutral-950 p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center sm:text-left">
          Historial de Pedidos
        </h1>

        {pedidos.length > 0 ? (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg overflow-hidden">
                
                <div className="bg-neutral-800/50 p-4 flex flex-col sm:flex-row justify-between items-center text-sm gap-2">
                  <div className="flex flex-col sm:flex-row sm:gap-6 gap-2 text-center sm:text-left">
                    <div>
                      <span className="text-neutral-500 uppercase font-semibold">Fecha: </span>
                      <span className="text-neutral-300 font-medium">{formatFecha(pedido.creado_en, true)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase font-semibold">Total: </span>
                      <span className="text-green-400 font-bold">${formatCLP(pedido.monto_total)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <span className="text-neutral-500 font-mono text-xs hidden md:inline">
                        {pedido.orden_compra}
                     </span>
                     
                     <button
                        onClick={() => handleDescargarBoleta(pedido.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                     >
                        Descargar Boleta
                     </button>
                  </div>
                </div>

                {/* Items del Pedido */}
                <div className="p-4 space-y-4">
                  {pedido.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-2 border-b border-neutral-800 last:border-b-0">
                      <img 
                        src={getImageUrl(item.imagen_producto) || "https://placehold.co/100x100/374151/9ca3af?text=N/A"} 
                        alt={item.producto.nombre} // <-- También lo corregí aquí por si acaso
                        className="w-16 h-16 rounded-lg object-cover bg-neutral-800"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-white">{item.producto.nombre}</p> {/* <-- Y aquí */}
                        <p className="text-sm text-neutral-400">
                          {item.cantidad} x ${formatCLP(item.precio_al_momento_compra)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          ${formatCLP(item.cantidad * item.precio_al_momento_compra)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-neutral-900 border border-neutral-800 rounded-2xl p-12">
            <p className="text-neutral-500">No has realizado ningún pedido de productos todavía.</p>
            <Link to="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300 font-semibold transition">
              Ir a la tienda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorialPedidos;