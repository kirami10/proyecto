import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // ✅ Use context
import API_URL from "../api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Get login from context

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
        
        // ✅ Use context login
        login(data.access, { username });
        navigate("/profile");
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