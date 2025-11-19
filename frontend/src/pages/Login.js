import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import API_URL from "../api";
import toast from 'react-hot-toast'; // <-- AÑADIR IMPORT

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // <-- AÑADIDO
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // <-- AÑADIDO
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
        toast.error("Credenciales incorrectas"); // <-- MODIFICADO
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al intentar iniciar sesión"); // <-- MODIFICADO
    }
    setLoading(false); // <-- AÑADIDO
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 w-full max-w-sm shadow-xl shadow-black/40">
        <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
          Iniciar Sesión
        </h2>

        <div className="mb-4">
          <input
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading} // <-- AÑADIDO
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"} {/* <-- MODIFICADO */}
        </button>
      </div>
    </div>
  );
}

export default Login;