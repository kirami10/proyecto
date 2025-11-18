import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // <-- Añadido Link
import { useAuth } from "../AuthContext";
import API_URL from "../api";
import toast from 'react-hot-toast';

// --- Icono de Pesa (copiado de tu Navbar) ---
const DumbbellIcon = () => (
  <svg className="h-8 w-8 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM10.5 9h3v6h-3V9z" />
  </svg>
);
// --- Fin Icono ---

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault(); // <-- Previene que la página se recargue
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        login(data.access, { username });
        
        const pendingPlanId = localStorage.getItem('pendingPlanId');
        
        if (pendingPlanId) {
          localStorage.removeItem('pendingPlanId');
          navigate(`/comprar-plan/${pendingPlanId}`);
        } else {
          navigate("/profile");
        }
      } else {
        toast.error("Credenciales incorrectas");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al intentar iniciar sesión");
    }
    setLoading(false);
  };

  return (
    // --- ESTRUCTURA DE FLOWBITE ADAPTADA A TU TEMA ---
    <section className="bg-neutral-950">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        
        {/* Logo de tu App */}
        <Link to="/" className="flex items-center mb-6 text-2xl font-semibold text-white">
          <DumbbellIcon />
          Mi Gym App    
        </Link>

        {/* Tarjeta de Login */}
        <div className="w-full bg-neutral-900 rounded-lg shadow border border-neutral-800 md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-white md:text-2xl">
              Iniciar Sesión
            </h1>

            {/* --- INICIO DEL FORMULARIO --- */}
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              
              {/* Campo de Usuario */}
              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-white">Usuario</label>
                <input 
                  type="text" 
                  name="username" 
                  id="username" 
                  className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                  placeholder="tu_usuario" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Campo de Contraseña */}
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-white">Contraseña</label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  placeholder="••••••••" 
                  className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {/* Botón de Entrar (ahora es type="submit") */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {/* Enlace de Registro */}
              <p className="text-sm font-light text-neutral-400">
                ¿Aún no tienes cuenta? <Link to="/register" className="font-medium text-blue-500 hover:underline">Regístrate aquí</Link>
              </p>
            </form>
            {/* --- FIN DEL FORMULARIO --- */}

          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;