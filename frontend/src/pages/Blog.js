import React, { useState, useEffect } from "react";
import API_URL from "../api";

// --- Helper para Imágenes ---
const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};

// --- Helper para Fecha ---
const formatFecha = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-CL", { year: 'numeric', month: 'long', day: 'numeric' });
};

function Blog() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const res = await fetch(`${API_URL}/noticias/`);
        if (res.ok) {
          const data = await res.json();
          setNoticias(data);
        }
      } catch (error) {
        console.error("Error cargando noticias:", error);
      }
      setLoading(false);
    };
    fetchNoticias();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      
      {/* --- 1. HERO SECTION (Historia) --- */}
      <div className="relative bg-neutral-900 border-b border-neutral-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-neutral-900 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Más de 10 años</span>{' '}
                  <span className="block text-blue-600 xl:inline">forjando campeones</span>
                </h1>
                <p className="mt-3 text-base text-neutral-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Desde 2015, Mi Gym App se ha dedicado al acondicionamiento físico integral en Arica. 
                  Comenzamos en un pequeño garaje y hoy somos el centro de referencia para el entrenamiento de fuerza y salud.
                </p>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full opacity-60 hover:opacity-100 transition duration-500"
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
            alt="Gimnasio interior"
          />
        </div>
      </div>

      {/* --- 2. EL DUEÑO --- */}
      <div className="py-16 bg-neutral-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-8 lg:mb-0">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
                    <img 
                        src="https://images.unsplash.com/photo-1567013127542-490d757e51fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                        alt="Dueño del gimnasio"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <div className="lg:pl-10">
              <h2 className="text-base text-blue-500 font-semibold tracking-wide uppercase">El Fundador</h2>
              <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                Juan "El Coach" Pérez
              </h3>
              <p className="mt-4 text-lg text-neutral-400">
                "Mi filosofía es simple: la constancia supera al talento. Fundé este gimnasio no solo para crear cuerpos estéticos, sino para construir mentes fuertes. Cuento con certificaciones internacionales en CrossFit y Halterofilia, y estoy aquí para guiarte en cada paso."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. UBICACIÓN (Mapa Actualizado) --- */}
      <div className="bg-neutral-900 py-12 border-y border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl font-extrabold text-white mb-8">Nuestra Ubicación</h2>
             <p className="mb-8 text-neutral-400">Nos encontramos en Robinson Rojas 4452, Arica.</p>
             <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg border border-neutral-700">
                {/* Embed de Google Maps con la dirección exacta:
                    Robinson Rojas 4452, Arica, Arica y Parinacota
                */}
                <iframe 
                    src="https://maps.google.com/maps?q=Robinson%20Rojas%204452%2C%20Arica%2C%20Chile&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa Ubicación"
                ></iframe>
             </div>
          </div>
      </div>

      {/* --- 4. NOTICIAS Y EVENTOS (Dinámico) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Novedades del Gym</h2>
            <p className="mt-4 text-lg text-neutral-400">Entérate de nuestros próximos eventos, avisos y celebraciones.</p>
        </div>

        {loading ? (
             <p className="text-center text-neutral-500">Cargando noticias...</p>
        ) : noticias.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-3">
                {noticias.map((noticia) => (
                    <div key={noticia.id} className="bg-neutral-900 overflow-hidden rounded-xl shadow-lg border border-neutral-800 hover:border-blue-600 transition duration-300 flex flex-col">
                        <div className="flex-shrink-0 h-48 overflow-hidden">
                            <img 
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" 
                                src={getImageUrl(noticia.imagen) || "https://placehold.co/600x400/374151/9ca3af?text=Noticia"} 
                                alt={noticia.titulo} 
                            />
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-500">
                                    {formatFecha(noticia.creado_en)}
                                </p>
                                <div className="block mt-2">
                                    <p className="text-xl font-semibold text-white">{noticia.titulo}</p>
                                    <p className="mt-3 text-base text-neutral-400 line-clamp-3">{noticia.contenido}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center bg-neutral-900 rounded-xl p-10 border border-neutral-800">
                <p className="text-neutral-500">No hay noticias publicadas recientemente.</p>
            </div>
        )}
      </div>

    </div>
  );
}

export default Blog;