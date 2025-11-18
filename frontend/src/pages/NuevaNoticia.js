import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import toast from 'react-hot-toast';
import { useAuth } from "../AuthContext";

function NuevaNoticia() {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagen, setImagen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { authToken } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !contenido) {
        toast.error("Título y contenido son obligatorios");
        return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("contenido", contenido);
    if (imagen) {
      formData.append("imagen", imagen);
    }

    setLoading(true);
    const loadingToast = toast.loading("Publicando noticia...");

    try {
      const response = await fetch(`${API_URL}/noticias/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`, // Token de Admin
          // No ponemos Content-Type porque FormData lo gestiona automáticamente
        },
        body: formData,
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success("¡Noticia publicada con éxito!");
        navigate("/nosotros"); // Redirigir al Blog
      } else {
        const data = await response.json();
        toast.error("Error al publicar: " + JSON.stringify(data));
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
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center tracking-wide">
          Publicar Novedad
        </h1>

        <div className="bg-neutral-900 p-8 rounded-xl shadow-lg border border-neutral-800">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Título */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-2 font-medium">Título de la Noticia</label>
                    <input
                        type="text"
                        className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition text-white"
                        placeholder="Ej: ¡Celebramos nuestro 5to Aniversario!"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />
                </div>

                {/* Contenido */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-2 font-medium">Contenido</label>
                    <textarea
                        className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none h-40 text-white"
                        placeholder="Escribe los detalles de la noticia aquí..."
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        required
                    />
                </div>

                {/* Imagen */}
                <div>
                    <label className="block text-neutral-400 text-sm mb-2 font-medium">Imagen Destacada (Opcional)</label>
                    
                    <div 
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-neutral-800/50 transition group"
                    >
                        {previewUrl ? (
                            <div className="relative w-full h-64">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <span className="text-white font-semibold">Cambiar Imagen</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-neutral-500 group-hover:text-blue-500 transition" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="mt-1 text-sm text-neutral-400">Click para subir una imagen</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/nosotros")}
                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                        {loading ? "Publicando..." : "Publicar Noticia"}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaNoticia;