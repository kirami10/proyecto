import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_URL from "../api";
import toast from 'react-hot-toast'; // Importamos toast
import { useAuth } from "../AuthContext"; // Importamos useAuth

// --- Helpers de Formato (sin cambios) ---
const formatCLP = (value) => {
  const cleanValue = (value || "0").toString().replace(/\D/g, "");
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};

// --- AÑADIDO: Helper de Fecha para Reseñas ---
const formatFechaReview = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-CL", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
};

// --- AÑADIDO: Componente de Estrellas (Solo visual) ---
const StarRating = ({ rating }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <svg
            key={starValue}
            className={`w-5 h-5 ${starValue <= rating ? 'text-yellow-400' : 'text-neutral-600'}`}
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

  // --- AÑADIDO: Estados para Reseñas ---
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5); // Estado para el formulario
  const [newComment, setNewComment] = useState(""); // Estado para el formulario
  const [submitting, setSubmitting] = useState(false);
  const { authToken, user } = useAuth(); // Obtenemos el usuario actual
  // --- FIN AÑADIDO ---

  const { addToCart } = useCart();
  const navigate = useNavigate();

  // --- AÑADIDO: Función para cargar reseñas ---
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_URL}/productos/${productoId}/reviews/`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Error cargando reseñas:", err);
    }
    setLoadingReviews(false);
  }, [productoId]);
  // --- FIN AÑADIDO ---

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/productos/${productoId}/`);
        if (res.ok) {
          const data = await res.json();
          setProducto(data);
          // Si el producto se carga, cargamos las reseñas
          fetchReviews(); // <-- AÑADIDO
        } else {
          setError(true);
          setLoading(false); // Detenemos la carga si hay error
        }
      } catch (err) {
        setError(true);
        setLoading(false); // Detenemos la carga si hay error
      }
      setLoading(false);
    };

    fetchProducto();
  }, [productoId, fetchReviews]); // <-- MODIFICADO

  const handleAddToCart = () => {
    if (!token) {
      navigate("/login");
    } else {
      addToCart(producto);
    }
  };

  // --- AÑADIDO: Función para enviar la reseña ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!authToken) {
      toast.error("Debes iniciar sesión para dejar una reseña");
      return;
    }
    if (newComment.length < 5) {
      toast.error("El comentario debe tener al menos 5 caracteres");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Enviando reseña...");

    try {
      const response = await fetch(`${API_URL}/productos/${productoId}/reviews/`, { // <-- Ruta modificada
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          rating: newRating,
          comentario: newComment,
        }),
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success("Reseña publicada con éxito");
        setNewComment("");
        setNewRating(5);
        fetchReviews(); // Recargamos las reseñas
      } else {
        const data = await response.json();
        toast.error(data.error || "No se pudo publicar la reseña");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Error de conexión");
    }
    setSubmitting(false);
  };
  // --- FIN AÑADIDO ---


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <p className="text-white text-xl">Cargando producto...</p>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-6">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Producto no encontrado</h1>
        <p className="text-neutral-400 mb-8">El producto que buscas no existe.</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
          Volver a la Tienda
        </Link>
      </div>
    );
  }

  const imageUrl = getImageUrl(producto.imagen);
  // Verificamos si el usuario actual ya dejó una reseña
  const userHasReviewed = reviews.some(review => review.user === user?.user_id);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="container mx-auto max-w-4xl">
        {/* --- Sección de Producto --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700/50 shadow-lg">
            <img
              src={imageUrl || "https://placehold.co/600x600/374151/9ca3af?text=Sin+Imagen"}
              alt={producto.nombre}
              className="w-full h-full object-cover aspect-square"
            />
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold text-white">{producto.nombre}</h1>
            <span className="text-4xl font-bold text-blue-400">
              ${formatCLP(producto.precio)}
            </span>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full self-start ${
              producto.stock > 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}>
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

        {/* --- AÑADIDO: Sección de Reseñas --- */}
        <div className="mt-16 border-t border-neutral-800 pt-10">
          <h2 className="text-3xl font-bold text-white mb-8">
            Reseñas ({reviews.length})
          </h2>
          
          {/* --- Formulario para crear reseña --- */}
          {token && !userHasReviewed && (
            <form onSubmit={handleSubmitReview} className="bg-neutral-800 border border-neutral-700 p-6 rounded-xl mb-8">
              <h3 className="text-xl font-semibold mb-4">Escribe tu reseña</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Puntuación</label>
                {/* Usamos un Select simple para las estrellas */}
                <select 
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 focus:outline-none focus:border-blue-500"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 estrellas)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 estrellas)</option>
                  <option value={3}>⭐⭐⭐ (3 estrellas)</option>
                  <option value={2}>⭐⭐ (2 estrellas)</option>
                  <option value={1}>⭐ (1 estrella)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Comentario</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="4"
                  placeholder="Describe tu experiencia con el producto..."
                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 focus:outline-none focus:border-blue-500"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Publicar Reseña"}
              </button>
            </form>
          )}

          {token && userHasReviewed && (
            <div className="bg-neutral-800 border border-blue-700 p-4 rounded-xl mb-8 text-center text-blue-300">
              Ya has dejado una reseña para este producto.
            </div>
          )}
          
          {/* --- Lista de reseñas existentes --- */}
          <div className="space-y-6">
            {loadingReviews ? (
              <p className="text-neutral-400">Cargando reseñas...</p>
            ) : reviews.length === 0 ? (
              <p className="text-neutral-500">Aún no hay reseñas para este producto.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 border-b border-neutral-800 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-white">{review.username}</h4>
                    <span className="text-sm text-neutral-500">{formatFechaReview(review.creado_en)}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-neutral-300 mt-3">{review.comentario}</p>
                </div>
              ))
            )}
          </div>
        </div>
        {/* --- FIN AÑADIDO --- */}

      </div>
    </div>
  );
}

export default ProductoDetalle;