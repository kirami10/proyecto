import React, { useState, useEffect, useCallback } from "react";
import API_URL from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from 'react-hot-toast'; 

// --- Helpers ---
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};

// --- NUEVO: Lógica para formatear cantidad vendida ---
const formatVentas = (cantidad) => {
    if (!cantidad) return "0 vendidos";
    if (cantidad < 10) return `${cantidad} vendidos`;
    if (cantidad < 100) return "+10 vendidos";
    if (cantidad < 1000) return "+100 vendidos";
    if (cantidad < 10000) return "+1.000 vendidos";
    if (cantidad < 100000) return "+10.000 vendidos";
    if (cantidad < 1000000) return "+100.000 vendidos";
    return "+1.000.000 vendidos";
};

// --- Tarjeta de Producto Modificada ---
const ProductCard = ({ producto, onAddToCart, cantidadEnCarro }) => { 
  const imageUrl = getImageUrl(producto.imagen);

  const handleAddClick = () => {
    if (cantidadEnCarro + 1 > producto.stock) {
      toast.error(`No puedes añadir más. Solo quedan ${producto.stock} en stock.`);
      return;
    }
    onAddToCart(producto);
  };

  return (
    <div className="group relative flex flex-col rounded-xl shadow-lg overflow-hidden bg-neutral-800 border border-neutral-700/50 transition-all duration-300 hover:shadow-blue-900/20">
      
      <Link to={`/producto/${producto.id}`} className="flex flex-col flex-1 relative">
        
        {cantidadEnCarro > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            En tu carro: {cantidadEnCarro}
          </div>
        )}
        
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={imageUrl || "https://placehold.co/400x400/374151/9ca3af?text=Sin+Imagen"}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        
        <div className="flex-1 p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-white truncate mb-2">{producto.nombre}</h3>
          
          {/* --- SECCIÓN DE ESTADÍSTICAS (Reemplaza descripción) --- */}
          <div className="flex items-center gap-3 mb-4 h-6"> {/* Altura fija para alinear */}
            {/* Rating */}
            <div className="flex items-center gap-1 bg-neutral-700/50 px-2 py-0.5 rounded text-xs font-medium text-yellow-400 border border-neutral-700">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.54-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.07 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>
                <span>{producto.rating_promedio}</span>
            </div>

            {/* Ventas */}
            <div className="text-xs text-neutral-400 font-medium">
                {formatVentas(producto.total_vendidos)}
            </div>
          </div>
          {/* --- FIN SECCIÓN --- */}

          <div className="mt-auto flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-400">
              ${formatCLP(producto.precio)}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              producto.stock > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}>
              {producto.stock > 0 ? `${producto.stock} disp.` : "Agotado"}
            </span>
          </div>
        </div>
      </Link>

      <button 
        onClick={handleAddClick} 
        disabled={producto.stock === 0}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 transition duration-300 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed"
      >
        {producto.stock > 0 ? "Añadir al Carrito" : "Agotado"}
      </button>
    </div>
  );
};


function Home({ token }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart(); 

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

  const getQuantityInCart = (productoId) => {
    const item = cartItems.find(item => item.producto === productoId);
    return item ? item.cantidad : 0;
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
                  cantidadEnCarro={getQuantityInCart(producto.id)} 
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