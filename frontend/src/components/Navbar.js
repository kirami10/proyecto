import React, { useState, useEffect, useRef, useCallback } from "react"; // <-- AÑADIDO useCallback
import { Link } from "react-router-dom";
<<<<<<< HEAD
import { useCart } from "../context/CartContext"; 
import API_URL from "../api"; // Necesario para la API de Notificaciones
=======
import { useCart } from "../context/CartContext"; // <-- Importamos el hook del carrito
>>>>>>> parent of 281861c (se añadió el blog y sus respectivas funciones)

// --- ICONOS ---
const DumbbellIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM10.5 9h3v6h-3V9z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// --- Helpers ---
const getNotificationIcon = (tipo) => {
    switch (tipo) {
        case 'alerta': return <span className="text-red-500 text-xl">⚠️</span>;
        case 'exito': return <span className="text-green-500 text-xl">✅</span>;
        default: return <span className="text-blue-500 text-xl">ℹ️</span>;
    }
};

const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("es-CL", {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
};

function Navbar({ token, onLogout, role }) {
<<<<<<< HEAD
  const { itemCount } = useCart();
  const [notificaciones, setNotificaciones] = useState([]);
  
  // Estados para controlar los menús
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // Refs para detectar clicks fuera
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
=======
  const { itemCount } = useCart(); // <-- Obtenemos el contador de items
>>>>>>> parent of 281861c (se añadió el blog y sus respectivas funciones)
  
  const isAdmin = role === "admin";
  const isStaff = role === "contadora";
  const fetchNotificaciones = useCallback(async () => {
      if (!token) return;
      try {
          const res = await fetch(`${API_URL}/notificaciones/`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) setNotificaciones(data);
          }
      } catch (err) { console.error(err); }

  }, [token]);

  useEffect(() => {
      fetchNotificaciones();
      const interval = setInterval(fetchNotificaciones, 10000);
      return () => clearInterval(interval);
  }, [fetchNotificaciones]); // Dependencia fetchNotificaciones

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const handleToggleNotif = async () => {
      if (!showNotif && unreadCount > 0) {
          try {
              await fetch(`${API_URL}/notificaciones/marcar_todas_leidas/`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
              });
              // Nota: Dejamos que el poll (cada 10s) actualice el estado a gris
              // Nota: No actualizamos el estado local 'leida' aquí para que
              // el usuario siga viéndolas resaltadas hasta la próxima recarga.

              // Nota: No actualizamos el estado local 'leida' aquí para que
              // el usuario siga viéndolas resaltadas hasta la próxima recarga.

          } catch (err) { console.error(err); }
      }
      setShowNotif(!showNotif);
      setShowUserMenu(false); 
      setShowAdminMenu(false);
  };

  // Manejo de clicks fuera para cerrar menús
  useEffect(() => {
      const handleClickOutside = (event) => {
          if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
          if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
          if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) setShowAdminMenu(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <nav className="w-full bg-neutral-900 border-b border-neutral-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
      
      {/* --- 1. IZQUIERDA: LOGO --- */}
      <div className="flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white transition-colors duration-300 hover:text-blue-400">
          <DumbbellIcon />
          <span className="hidden sm:inline">Mi Gym App</span>
        </Link>
      </div>

      {/* --- 2. CENTRO: NAVEGACIÓN PÚBLICA --- */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/" className="text-neutral-300 font-medium hover:text-white transition">Tienda</Link>
        <Link to="/nosotros" className="text-neutral-300 font-medium hover:text-white transition">Nosotros</Link>
        <Link to="/planes" className="text-neutral-300 font-medium hover:text-white transition">Planes</Link>
      </div>

      {/* --- 3. DERECHA: ACCIONES --- */}
      <div className="flex items-center gap-3 sm:gap-4">
        
<<<<<<< HEAD
        <div className="md:hidden flex gap-3">
            <Link to="/" className="text-neutral-300 hover:text-white">Tienda</Link>
            <Link to="/planes" className="text-neutral-300 hover:text-white">Planes</Link>
        </div>

=======
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
>>>>>>> parent of 281861c (se añadió el blog y sus respectivas funciones)
        {token ? (
          <>
            {/* --- MENÚ ADMIN --- */}
            {(isAdmin || isStaff) && (
                <div className="relative" ref={adminMenuRef}>
                    <button 
                        onClick={() => { setShowAdminMenu(!showAdminMenu); setShowUserMenu(false); setShowNotif(false); }}
                        className={`p-2 rounded-full transition-all ${showAdminMenu ? 'bg-purple-600 text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                        title="Menú Administración"
                    >
                        <AdminIcon />
                    </button>
                    {showAdminMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                            <div className="px-4 py-2 text-xs font-bold text-purple-500 uppercase tracking-wider border-b border-neutral-800">Administración</div>
                            
                            {isAdmin && <Link to="/gestion-usuarios" onClick={() => setShowAdminMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Usuarios</Link>}
                            <Link to="/publicar-producto" onClick={() => setShowAdminMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Productos</Link>
                            <Link to="/gestion-planes" onClick={() => setShowAdminMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Planes</Link>
                            {isAdmin && <Link to="/publicar-noticia" onClick={() => setShowAdminMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Blog (Noticia)</Link>}
                            {isAdmin && <Link to="/gestion-notificaciones" onClick={() => setShowAdminMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Notificaciones</Link>}
                        </div>
                    )}
                </div>
            )}

<<<<<<< HEAD
            {/* --- CAMPANA DE NOTIFICACIONES --- */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={handleToggleNotif}
                    className={`p-2 rounded-full transition-all relative ${showNotif ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                >
                    <BellIcon />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </button>

                {showNotif && (
                    <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right">
                         <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notificaciones.length === 0 ? (
                                <div className="p-4 text-center text-neutral-500 text-sm">No hay notificaciones.</div>
                            ) : (
                                notificaciones.map((notif) => (
                                    <div key={notif.id} className={`p-4 border-b border-neutral-800 flex gap-3 items-start ${notif.leida ? 'bg-neutral-900 opacity-60' : 'bg-neutral-800/30'}`}>
                                        <div className="mt-1 flex-shrink-0">{getNotificationIcon(notif.tipo)}</div>
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm ${notif.leida ? 'font-medium text-neutral-300' : 'font-bold text-white'}`}>{notif.titulo}</p>
                                                {!notif.leida && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>}
                                            </div>
                                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{notif.mensaje}</p>
                                            <p className="text-[10px] text-neutral-600 mt-2 text-right">{formatDateTime(notif.creado_en)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- CARRITO --- */}
=======
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
>>>>>>> parent of 281861c (se añadió el blog y sus respectivas funciones)
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

            {/* --- MENÚ USUARIO (Perfil) --- */}
            <div className="relative" ref={userMenuRef}>
                <button 
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowAdminMenu(false); setShowNotif(false); }}
                    className={`flex items-center gap-2 p-2 rounded-full transition-all ${showUserMenu ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'}`}
                >
                    <UserIcon />
                </button>

                {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                        <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800">Mi Cuenta</div>
                        
                        <Link to="/mi-plan" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Mi Plan</Link>
                        <Link to="/historial" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Mis Pedidos</Link>
                        <Link to="/profile" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-white hover:bg-neutral-800">Perfil</Link>
                        
                        <div className="border-t border-neutral-800 mt-1 pt-1">
                            <button 
                                onClick={onLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>

          </>
        ) : (
          // --- LOGIN / REGISTER (Invitado) ---
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-neutral-300 font-medium px-3 py-2 rounded-lg transition-all hover:bg-neutral-800 hover:text-white">Login</Link>
            <Link to="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-md">Registro</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;