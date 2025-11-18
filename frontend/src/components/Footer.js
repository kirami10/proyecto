import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 text-white pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Columna 1: Marca */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white mb-4">
              <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM10.5 9h3v6h-3V9z" />
              </svg>
              <span>Mi Gym App</span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Forjando campeones desde 2015. Tu centro integral de acondicionamiento físico en Arica.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Navegación</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-neutral-300 hover:text-blue-500 transition">Tienda</Link></li>
              <li><Link to="/planes" className="text-neutral-300 hover:text-blue-500 transition">Planes</Link></li>
              <li><Link to="/nosotros" className="text-neutral-300 hover:text-blue-500 transition">Nosotros</Link></li>
            </ul>
          </div>

          {/* Columna 3: Legal / Cuenta */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Cuenta</h3>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-neutral-300 hover:text-blue-500 transition">Iniciar Sesión</Link></li>
              <li><Link to="/register" className="text-neutral-300 hover:text-blue-500 transition">Registrarse</Link></li>
              <li><Link to="/profile" className="text-neutral-300 hover:text-blue-500 transition">Mi Perfil</Link></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Robinson Rojas 4452, Arica,<br/>Arica y Parinacota</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>contacto@migymapp.cl</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>+56 9 1234 5678</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800 pt-8 text-center">
          <p className="text-neutral-500 text-sm">
            &copy; {currentYear} Mi Gym App. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;