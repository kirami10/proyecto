import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext"; // ✅ Import AuthProvider
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
import Carrito from "./pages/Carrito";

// ✅ Separate component that uses the auth context
function AppRoutes() {
  const { authToken, logout, userRole } = useAuth();

  return (
    <Router>
      <Navbar token={authToken} onLogout={logout} role={userRole} />
      <div className="min-h-screen bg-neutral-950 text-white p-6">
        <Routes>
          <Route path="/" element={<Home token={authToken} />} />
          <Route path="/login" element={authToken ? <Navigate to="/profile" replace /> : <Login />} />
          <Route path="/register" element={authToken ? <Navigate to="/profile" replace /> : <Register />} />
          <Route path="/planes" element={<Planes />} />
          
          {/* Rutas Privadas */}
          <Route path="/profile" element={authToken ? <Profile token={authToken} /> : <Navigate to="/login" replace />} />
          <Route path="/mi-plan" element={authToken ? <MiPlan /> : <Navigate to="/login" replace />} />
          <Route path="/carrito" element={authToken ? <Carrito /> : <Navigate to="/login" replace />} />
          
          {/* Rutas Admin/Staff */}
          <Route path="/publicar-producto" element={authToken && (userRole === "admin" || userRole === "contadora") ? <NewPost /> : <Navigate to="/" replace />} />
          <Route path="/gestion-usuarios" element={authToken && userRole === "admin" ? <GestionUsuarios /> : <Navigate to="/" replace />} />
          <Route path="/gestion-planes" element={authToken && (userRole === "admin" || userRole === "contadora") ? <GestionPlanes /> : <Navigate to="/" replace />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider> {/* ✅ Wrap with AuthProvider */}
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;