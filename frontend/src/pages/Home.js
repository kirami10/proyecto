import React, { useState, useEffect, useCallback } from "react";
import API_URL from "../api";
import { useNavigate, Link } from "react-router-dom"; // <-- MODIFICADO: Añadimos Link
import { useCart } from "../context/CartContext";

// --- Helpers de Formato ---
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

// --- Componente de Tarjeta de Producto ---
const ProductCard = ({ producto, onAddToCart }) => {
  const imageUrl = getImageUrl(producto.imagen);

  return (
    <div className="group relative flex flex-col rounded-xl shadow-lg overflow-hidden bg-neutral-800 border border-neutral-700/50 transition-all duration-300 hover:shadow-blue-900/20">
      
      {/* --- MODIFICADO: Enlace a la página de detalle --- */}
      <Link to={`/producto/${producto.id}`} className="flex flex-col flex-1">
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={imageUrl || "https://placehold.co/400x400/374151/9ca3af?text=Sin+Imagen"}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="flex-1 p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-white truncate">{producto.nombre}</h3>
          <p className="text-sm text-neutral-400 mb-4 h-10 overflow-hidden">
            {producto.descripcion || "Sin descripción"}
          </p>
          <div className="mt-auto flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-400">
              ${formatCLP(producto.precio)}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              producto.stock > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}>
              {producto.stock > 0 ? `${producto.stock} en Stock` : "Agotado"}
            </span>
          </div>
        </div>
      </Link>
      {/* --- FIN DE LA MODIFICACIÓN --- */}

      <button 
        onClick={() => onAddToCart(producto)}
        disabled={producto.stock === 0}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 transition duration-300 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed"
      >
        {producto.stock > 0 ? "Añadir al Carrito" : "Agotado"}
      </button>
    </div>
  );
};


// --- Componente Principal de la Página Home ---
function Home({ token }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart(); 

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/productos/`);
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (err) { console.error("Error de red:", err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleAddToCart = (producto) => {
    if (!token) {
      navigate("/login");
    } else {
      addToCart(producto);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            Catálogo de <span className="text-blue-500">Equipamiento</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-neutral-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Todo lo que necesitas para tu entrenamiento.
          </p>
        </div>
        
        {loading ? (
          <p className="text-center text-neutral-400">Cargando productos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productos.length > 0 ? (
              productos.map((producto) => (
                <ProductCard 
                  key={producto.id} 
                  producto={producto} 
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <p className="text-center col-span-full text-neutral-500">
                No hay productos disponibles en este momento.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;