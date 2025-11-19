import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_URL from "../api";
import toast from 'react-hot-toast'; 
import { useAuth } from "../AuthContext"; 

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
const formatFechaReview = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-CL", {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// --- Componente Estrellas ---
const StarRating = ({ rating, setRating = null }) => { 
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <svg
            key={starValue}
            onClick={() => setRating ? setRating(starValue) : null}
            className={`w-5 h-5 ${starValue <= rating ? 'text-yellow-400' : 'text-neutral-600'} ${setRating ? 'cursor-pointer' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.54-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.07 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
          </svg>
        );
      })}
    </div>
  );
};


function ProductoDetalle({ token }) {
  const { productoId } = useParams();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // --- NUEVO: Estado para la imagen activa ---
  const [activeImage, setActiveImage] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const { authToken, user, userRole } = useAuth();
  const { addToCart, cartItems } = useCart(); 
  const navigate = useNavigate();

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_URL}/productos/${productoId}/reviews/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) { console.error("Error reseñas:", err); }
    setLoadingReviews(false);
  }, [productoId, authToken]); 

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/productos/${productoId}/`);
        if (res.ok) {
          const data = await res.json();
          setProducto(data);
          // --- NUEVO: Setear imagen inicial ---
          setActiveImage(data.imagen); 
          fetchReviews(); 
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        setError(true);
        setLoading(false);
      }
      setLoading(false);
    };

    fetchProducto();
  }, [productoId, fetchReviews]); 

  const handleAddToCart = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    const itemInCart = cartItems.find(item => item.producto === producto.id);
    const currentQty = itemInCart ? itemInCart.cantidad : 0;
    if (currentQty + 1 > producto.stock) {
        toast.error(`Solo quedan ${producto.stock} en stock.`);
        return;
    }
    addToCart(producto);
  };

  // ... (handleSubmitReview y handleToggleVisibility sin cambios, copiarlos del anterior o usar este bloque completo) ...
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!authToken) return toast.error("Inicia sesión para reseñar");
    if (newComment.length < 5) return toast.error("Comentario muy corto");

    setSubmitting(true);
    const loadingToast = toast.loading("Enviando...");
    try {
      const response = await fetch(`${API_URL}/productos/${productoId}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify({ rating: newRating, comentario: newComment }),
      });
      toast.dismiss(loadingToast);
      if (response.ok) {
        toast.success("Reseña publicada");
        setNewComment("");
        setNewRating(5);
        fetchReviews();
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al publicar");
      }
    } catch (err) { toast.dismiss(loadingToast); toast.error("Error de conexión"); }
    setSubmitting(false);
  };

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
      const newVisibility = !currentVisibility;
      const loadingToast = toast.loading(`Actualizando...`);
      try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}/moderate/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
          body: JSON.stringify({ is_visible: newVisibility }),
        });
        toast.dismiss(loadingToast);
        if (!response.ok) throw new Error('Error moderando');
        const updatedReview = await response.json();
        setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
        toast.success('Actualizado');
      } catch (err) { toast.dismiss(loadingToast); toast.error(err.message); }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">Cargando...</div>;
  if (error || !producto) return <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">Producto no encontrado</div>;

  // Construir lista de todas las imágenes (Principal + Extras)
  const allImages = [producto.imagen, ...(producto.imagenes || []).map(img => img.imagen)].filter(Boolean);
  const activeImageUrl = getImageUrl(activeImage);
  const itemInCart = cartItems.find(item => item.producto === producto.id);
  const qtyInCart = itemInCart ? itemInCart.cantidad : 0;
  const userHasReviewed = reviews.some(review => review.user === user?.user_id);
  const isAdmin = userRole === 'admin'; 

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="container mx-auto max-w-4xl">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* --- COLUMNA IMÁGENES (MODIFICADA) --- */}
          <div className="flex flex-col gap-4">
              {/* Imagen Principal */}
              <div className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700/50 shadow-lg aspect-square">
                <img
                  src={activeImageUrl || "https://placehold.co/600x600/374151/9ca3af?text=Sin+Imagen"}
                  alt={producto.nombre}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>
              
              {/* Galería de Miniaturas */}
              {allImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                      {allImages.map((img, index) => {
                          const url = getImageUrl(img);
                          const isActive = img === activeImage;
                          return (
                              <button
                                key={index}
                                onClick={() => setActiveImage(img)}
                                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${isActive ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                              >
                                  <img src={url} alt={`Vista ${index}`} className="w-full h-full object-cover" />
                              </button>
                          );
                      })}
                  </div>
              )}
          </div>
          {/* --- FIN COLUMNA IMÁGENES --- */}

          <div className="flex flex-col gap-4 relative"> 
            {qtyInCart > 0 && (
                <div className="bg-blue-600/20 border border-blue-600 text-blue-300 px-4 py-2 rounded-lg self-start mb-2 font-semibold text-sm">
                    🛒 Tienes {qtyInCart} en tu carrito
                </div>
            )}
            <h1 className="text-4xl font-bold text-white">{producto.nombre}</h1>
            <span className="text-4xl font-bold text-blue-400">${formatCLP(producto.precio)}</span>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full self-start ${producto.stock > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {producto.stock > 0 ? `${producto.stock} en Stock` : "Agotado"}
            </span>
            <div className="border-t border-neutral-800 my-4"></div>
            <h2 className="text-xl font-semibold text-white">Descripción</h2>
            <p className="text-neutral-300 text-base leading-relaxed">
              {producto.descripcion || "Este producto no tiene descripción."}
            </p>
            <button
              onClick={handleAddToCart}
              disabled={producto.stock === 0}
              className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-lg transition duration-300 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-lg"
            >
              {producto.stock > 0 ? "Añadir al Carrito" : "Agotado"}
            </button>
          </div>
        </div>

        {/* --- Sección de Reseñas (Sin cambios estructurales, solo render) --- */}
        <div className="mt-16 border-t border-neutral-800 pt-10">
          <h2 className="text-3xl font-bold text-white mb-8">
            Reseñas ({reviews.filter(r => r.is_visible).length})
          </h2>
          
          {token && !userHasReviewed && !isAdmin && ( 
            <form onSubmit={handleSubmitReview} className="bg-neutral-800 border border-neutral-700 p-6 rounded-xl mb-8">
              <h3 className="text-xl font-semibold mb-4">Escribe tu reseña</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Puntuación</label>
                <StarRating rating={newRating} setRating={setNewRating} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Comentario</label>
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows="4" className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 text-white" required />
              </div>
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg transition hover:bg-blue-700 disabled:opacity-50">{submitting ? "Enviando..." : "Publicar"}</button>
            </form>
          )}

          <div className="space-y-6">
            {loadingReviews ? <p className="text-neutral-400">Cargando...</p> : reviews.length === 0 ? <p className="text-neutral-500">Sin reseñas.</p> : 
              reviews.map((review) => (
                <div key={review.id} className={`p-4 border-b border-neutral-800 ${!review.is_visible ? 'bg-red-900/10 opacity-60' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-white">{review.username}</h4>
                      {!review.is_visible && isAdmin && <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-0.5 rounded-full">OCULTO</span>}
                    </div>
                    <span className="text-sm text-neutral-500">{formatFechaReview(review.creado_en)}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-neutral-300 mt-3">{review.comentario}</p>
                  {isAdmin && (
                    <button onClick={() => handleToggleVisibility(review.id, review.is_visible)} className={`mt-4 text-xs font-semibold px-3 py-1 rounded-lg transition ${review.is_visible ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                      {review.is_visible ? 'Ocultar' : 'Mostrar'}
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;