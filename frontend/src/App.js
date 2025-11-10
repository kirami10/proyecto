import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // ✅ Corregido

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NewPost from "./pages/NewPost";
import GestionUsuarios from "./pages/GestionUsuarios";
import GestionPlanes from "./pages/GestionPlanes"; // Nueva página de planes

function App() {
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
  }, [token]); // ✅ Dependencia correcta

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
              token && userRole === "admin" ? <GestionUsuarios token={token} /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/publicar-producto"
            element={
              token && (userRole === "admin" || userRole === "staff") ? <NewPost /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/gestion-planes"
            element={
              token && userRole === "admin" ? <GestionPlanes token={token} /> : <Navigate to="/" replace />
            }
          />

          <Route path="/" element={<Navigate to={token ? "/profile" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
