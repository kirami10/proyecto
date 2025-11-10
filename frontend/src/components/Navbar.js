import React from "react";
import { Link } from "react-router-dom";

function Navbar({ token, onLogout, role }) {
  return (
    <nav className="w-full bg-neutral-900 border-b border-neutral-700 px-6 py-4 flex items-center justify-between shadow-md shadow-black/30">
      <div className="text-xl font-bold text-white tracking-wide hover:text-blue-500 transition-colors duration-300">
        <Link to="/">Mi Gym App</Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Gestión de Usuarios solo para admin */}
        {token && role === "admin" && (
          <Link
            to="/gestion-usuarios"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium flex items-center gap-2 shadow-sm hover:shadow-purple-900/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              <path fillRule="evenodd" d="M5 14a7 7 0 1110 0H5z" />
            </svg>
            <span className="hidden sm:inline">Gestión Usuarios</span>
          </Link>
        )}

        {/* Publicar producto solo para admin o staff */}
        {token && (role === "admin" || role === "staff") && (
          <Link
            to="/publicar-producto"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center gap-2 shadow-sm hover:shadow-green-900/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Publicar Producto</span>
          </Link>
        )}

        {/* Gestión de Planes solo para admin */}
        {token && role === "admin" && (
          <Link
            to="/gestion-planes"
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium flex items-center gap-2 shadow-sm hover:shadow-yellow-900/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
              <path fillRule="evenodd" d="M3 11a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Gestión Planes</span>
          </Link>
        )}

        {token ? (
          <>
            <Link
              to="/profile"
              className="text-neutral-300 hover:text-white transition font-medium px-2 py-1 rounded hover:bg-neutral-800"
            >
              Perfil
            </Link>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-red-900/30"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="text-neutral-300 hover:text-white transition font-medium px-3 py-2 rounded hover:bg-neutral-800"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm hover:shadow-blue-900/30"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
