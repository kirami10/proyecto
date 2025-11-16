import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import API_URL from "../api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        login(data.access, { username });
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // Revisamos si había un plan pendiente guardado
        const pendingPlanId = localStorage.getItem('pendingPlanId');
        
        if (pendingPlanId) {
          // Si hay uno, limpiamos el localStorage
          localStorage.removeItem('pendingPlanId');
          // Y redirigimos a la compra de ese plan
          navigate(`/comprar-plan/${pendingPlanId}`);
        } else {
          // Si no, vamos al perfil (comportamiento normal)
          navigate("/profile");
        }
        // --- FIN DE LA MODIFICACIÓN ---

      } else {
        alert("Credenciales incorrectas");
      }
    } catch (err) {
      console.error(err);
      alert("Error al intentar iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 w-full max-w-sm shadow-xl shadow-black/40">
        <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
          Iniciar Sesión
        </h2>

        <div className="mb-4">
          <input
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

export default Login;