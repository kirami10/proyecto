import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NewPost from "./pages/NewPost"; // <--- Importamos el nuevo componente
import GestionUsuarios from "./pages/GestionUsuarios";

function App() {
  // ... (todo el código de estado y useEffect se mantiene igual) ...
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.is_superuser) {
          setUserRole("admin");
        } else if (decoded.is_staff) {
          setUserRole("staff");
        } else {
          setUserRole("user");
        }
      } catch (error) {
        console.error("Token inválido:", error);
        handleLogout();
      }
    } else {
      setUserRole(null);
    }
  }, [token]);

  const handleLogin = (access) => {
    localStorage.setItem("token", access);
    setToken(access);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserRole(null);
  };

  return (
    <Router>
      <Navbar token={token} onLogout={handleLogout} role={userRole} />

      <div className="min-h-screen bg-neutral-950 text-white p-6">
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/profile" replace /> : <Login onLogin={handleLogin} />}
          />
          <Route
             path="/register"
             element={token ? <Navigate to="/profile" replace /> : <Register />}
          />
          <Route
            path="/profile"
            element={token ? <Profile token={token} /> : <Navigate to="/login" replace />}
          />

          <Route
        path="/gestion-usuarios"
        element={
          token && userRole === "admin" ? (
            <GestionUsuarios token={token} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
          {/* NUEVA RUTA PROTEGIDA: Solo accesible si el rol es 'admin' */}
          <Route
            path="/publicar-producto"
            element={
              token && userRole === "admin" ? (
                <NewPost />
              ) : (
                // Si no es admin, redirigimos al inicio o al login según corresponda
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="/" element={<Navigate to={token ? "/profile" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;