import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext"; // <-- Importamos el hook del carrito

// Icono simple de Pesa (Dumbbell)
const DumbbellIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM10.5 9h3v6h-3V9z" />
  </svg>
);

function Navbar({ token, onLogout, role }) {
  const { itemCount } = useCart(); // <-- Obtenemos el contador de items
  
  // Usamos los roles de tu backend
  const isAdmin = role === "admin";
  const isStaff = role === "contadora";

  return (
    <nav className="w-full bg-neutral-900 border-b border-neutral-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
      
      {/* --- MARCA/LOGO --- */}
      <div className="flex-shrink-0">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 text-xl font-bold text-white transition-colors duration-300 hover:text-blue-400"
          title="Mi Gym App - Inicio"
        >
          <DumbbellIcon />
          <span className="hidden sm:inline">Mi Gym App</span>
        </Link>
      </div>

      {/* --- LINKS Y BOTONES --- */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* --- LINKS PÚBLICOS (Visibles para todos) --- */}
        <Link
          to="/"
          className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
        >
          Tienda
        </Link>
        <Link
          to="/planes"
          className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
        >
          Planes
        </Link>

        {/* --- NUEVO LINK DEL BLOG --- */}
        <Link
            to="/blog"
            className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
          >
            Blog
        </Link>
        {token && (isAdmin || isStaff) && (
        <Link
          to="/admin/blog"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold"
          >
          Blog Admin
        </Link>
      )}

        {/* --- LINKS DE ADMIN/STAFF --- */}
        {token && isAdmin && (
          <Link
            to="/gestion-usuarios"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
            title="Gestión de Usuarios"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" /><path fillRule="evenodd" d="M5 14a7 7 0 1110 0H5z" /></svg>
            <span className="hidden lg:inline">Usuarios</span>
          </Link>
          
        )}
        {token && (isAdmin || isStaff) && (
          <Link
            to="/publicar-producto"
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
            title="Gestión de Productos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            <span className="hidden lg:inline">Producto</span>
          </Link>
        )}
        {token && (isAdmin || isStaff) && (
          <Link
            to="/gestion-planes"
            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
            title="Gestión de Planes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" /><path fillRule="evenodd" d="M3 11a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" clipRule="evenodd" /></svg>
            <span className="hidden lg:inline">Planes</span>
          </Link>
        )}
        {/* --- FIN LINKS ADMIN/STAFF --- */}


        {/* --- LINKS DE AUTENTICACIÓN --- */}
        {token ? (
          <>
            <Link
              to="/mi-plan"
              className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
            >
              Mi Plan
            </Link>

            {/* --- AÑADIDO: Enlace a Historial de Pedidos --- */}
            <Link
              to="/historial"
              className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
            >
              Mis Pedidos
            </Link>
            
            <Link
              to="/profile"
              className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
            >
              Perfil
            </Link>
            
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
            >
              Cerrar sesión
            </button>

            {/* --- ÍCONO DE CARRITO (NUEVO) --- */}
            <Link to="/carrito" className="relative text-neutral-300 p-2 rounded-full transition-all hover:bg-neutral-800 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;