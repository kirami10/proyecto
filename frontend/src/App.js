import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; 
import { CartProvider } from "./context/CartContext"; 

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NewPost from "./pages/NewPost";
import GestionUsuarios from "./pages/GestionUsuarios";
import GestionPlanes from "./pages/GestionPlanes";
import Planes from "./pages/Planes";
import MiPlan from "./pages/MiPlan";
import Home from "./pages/Home";
import Carrito from "./pages/Carrito"; // <--- 1. IMPORTAR CARRITO

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role || 'cliente'); 
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
    <CartProvider>
      <Router>
        <Navbar token={token} onLogout={handleLogout} role={userRole} />
        <div className="min-h-screen bg-neutral-950 text-white p-6">
          <Routes>
            <Route path="/" element={<Home token={token} />} />
            <Route path="/login" element={token ? <Navigate to="/profile" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={token ? <Navigate to="/profile" replace /> : <Register />} />
            <Route path="/planes" element={<Planes />} />
            
            {/* Rutas Privadas (Requieren token) */}
            <Route path="/profile" element={token ? <Profile token={token} /> : <Navigate to="/login" replace />} />
            <Route path="/mi-plan" element={token ? <MiPlan /> : <Navigate to="/login" replace />} />
            <Route path="/carrito" element={token ? <Carrito /> : <Navigate to="/login" replace />} /> {/* <--- 2. AÑADIR RUTA */}
            
            {/* Rutas Admin/Staff */}
            <Route path="/publicar-producto" element={token && (userRole === "admin" || userRole === "contadora") ? <NewPost /> : <Navigate to="/" replace />} />
            <Route path="/gestion-usuarios" element={token && userRole === "admin" ? <GestionUsuarios /> : <Navigate to="/" replace />} />
            <Route path="/gestion-planes" element={token && (userRole === "admin" || userRole === "contadora") ? <GestionPlanes /> : <Navigate to="/" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;