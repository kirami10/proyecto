import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // <-- Añadido Link
import API_URL from "../api";
import toast from 'react-hot-toast';

// --- Icono de Pesa (copiado de tu Navbar) ---
const DumbbellIcon = () => (
  <svg className="h-8 w-8 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v12a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM10.5 9h3v6h-3V9z" />
  </svg>
);

// --- Funciones Auxiliares (Sin cambios) ---
const formatName = (name) => {
  if (!name) return "";
  let value = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  return value.replace(/\b\w/g, (l) => l.toUpperCase());
};
const formatRut = (rut) => {
  if (!rut) return "";
  let value = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  const endsWithK = value.endsWith("K");
  let cleanValue = value.replace(/K/g, "");
  if (endsWithK) cleanValue += "K";
  value = cleanValue;
  if (value.length > 9) value = value.slice(0, 9);
  if (value.length < 2) return value;
  const body = value.slice(0, -1);
  const dv = value.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};
const validateRut = (rut) => {
  if (!rut) return false;
  const cleanRut = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (cleanRut.length < 7) return false;
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  if (/(.)\1{6,}/.test(body)) return false;
  let sum = 0,
    multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const res = 11 - (sum % 11);
  return dv === (res === 11 ? "0" : res === 10 ? "K" : res.toString());
};
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let value = phone.replace(/\D/g, "");
  if (value.length > 9) value = value.slice(0, 9);
  if (value.length > 5) {
    return `${value.slice(0, 1)} ${value.slice(1, 5)} ${value.slice(5)}`;
  } else if (value.length > 1) {
    return `${value.slice(0, 1)} ${value.slice(1)}`;
  }
  return value;
};
// --- Fin Funciones Auxiliares ---

// --- Componente PhoneInput (Modificado levemente para el nuevo label) ---
const PhoneInput = ({ value, onChange, placeholder, id, label }) => (
  <div>
    <label htmlFor={id} className="block mb-2 text-sm font-medium text-white">{label}</label>
    <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
      <span className="pl-3 pr-2 text-neutral-400 select-none">+56</span>
      <input
        id={id}
        className="w-full bg-neutral-800 text-white px-2 py-2.5 focus:outline-none" // py-2.5 para alinear
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={11}
        required
      />
    </div>
  </div>
);
// --- Fin PhoneInput ---


// --- Componente Principal ---
function Register() {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [numeroPersonal, setNumeroPersonal] = useState("");
  const [numeroEmergencia, setNumeroEmergencia] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false); // <-- AÑADIDO

  const navigate = useNavigate();

  // Handlers (sin cambios)
  const handleNameChange = (e) => setNombre(formatName(e.target.value));
  const handleLastNameChange = (e) => setApellidos(formatName(e.target.value));
  const handleRutChange = (e) => setRut(formatRut(e.target.value));
  const handlePersonalPhoneChange = (e) =>
    setNumeroPersonal(formatPhoneNumber(e.target.value));
  const handleEmergencyPhoneChange = (e) =>
    setNumeroEmergencia(formatPhoneNumber(e.target.value));

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene recarga de página
    
    // Validaciones
    if (password !== password2) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!validateRut(rut)) {
      toast.error("RUT inválido.");
      return;
    }
    if (numeroPersonal.replace(/\D/g, "").length !== 9) {
      toast.error("El número personal debe tener 9 dígitos.");
      return;
    }
    if (numeroEmergencia.replace(/\D/g, "").length !== 9) {
      toast.error("El número de emergencia debe tener 9 dígitos.");
      return;
    }
    // --- AÑADIDA: Verificación de Términos ---
    if (!termsAccepted) {
      toast.error("Debes aceptar los Términos y Condiciones");
      return;
    }
    // --- FIN ---

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellidos,
          username,
          email,
          rut,
          numero_personal: "+56" + numeroPersonal.replace(/\s/g, ""),
          numero_emergencia: "+56" + numeroEmergencia.replace(/\s/g, ""),
          password,
          password2,
        }),
      });

      if (response.ok) {
        toast.success("Usuario registrado correctamente");
        navigate("/login");
      } else {
        const data = await response.json();
        if (data.rut) {
          toast.error(data.rut[0]);
        } else if (data.username) {
          toast.error(data.username[0]);
        } else {
          toast.error("Error al registrar: " + (data.detail || JSON.stringify(data)));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión.");
    }
    setLoading(false);
  };

  return (
    // --- ESTRUCTURA DE FLOWBITE ADAPTADA A TU TEMA ---
    <section className="bg-neutral-950">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        
        {/* Logo de tu App */}
        <Link to="/" className="flex items-center mb-6 text-2xl font-semibold text-white">
          <DumbbellIcon />
          Mi Gym App    
        </Link>

        {/* Tarjeta de Registro */}
        <div className="w-full bg-neutral-900 rounded-lg shadow border border-neutral-800 md:mt-0 sm:max-w-lg xl:p-0"> {/* sm:max-w-lg para más espacio */}
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-white md:text-2xl">
              Crear una cuenta
            </h1>

            {/* --- INICIO DEL FORMULARIO --- */}
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              
              {/* Grid para datos personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block mb-2 text-sm font-medium text-white">Nombre</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    id="nombre" 
                    className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                    placeholder="Juan" 
                    required
                    value={nombre}
                    onChange={handleNameChange}
                  />
                </div>
                <div>
                  <label htmlFor="apellidos" className="block mb-2 text-sm font-medium text-white">Apellidos</label>
                  <input 
                    type="text" 
                    name="apellidos" 
                    id="apellidos" 
                    className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                    placeholder="Pérez" 
                    required
                    value={apellidos}
                    onChange={handleLastNameChange}
                  />
                </div>
                <div>
                  <label htmlFor="username" className="block mb-2 text-sm font-medium text-white">Usuario</label>
                  <input 
                    type="text" 
                    name="username" 
                    id="username" 
                    className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                    placeholder="juanperez" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Correo</label>
                  <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                    placeholder="juan@correo.com" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="rut" className="block mb-2 text-sm font-medium text-white">RUT</label>
                  <input 
                    type="text" 
                    name="rut" 
                    id="rut" 
                    className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                    placeholder="12.345.678-K" 
                    required
                    value={rut}
                    onChange={handleRutChange}
                    maxLength={12}
                  />
                </div>
                <PhoneInput
                  id="numeroPersonal"
                  label="Teléfono Personal"
                  value={numeroPersonal}
                  onChange={handlePersonalPhoneChange}
                  placeholder="9 1234 5678"
                />
                <PhoneInput
                  id="numeroEmergencia"
                  label="Teléfono de Emergencia"
                  value={numeroEmergencia}
                  onChange={handleEmergencyPhoneChange}
                  placeholder="9 8765 4321"
                />
              </div>

              {/* Campos de Contraseña */}
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-white">Contraseña</label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  placeholder="••••••••" 
                  className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password2" className="block mb-2 text-sm font-medium text-white">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  name="password2" 
                  id="password2" 
                  placeholder="••••••••" 
                  className="bg-neutral-800 border border-neutral-700 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </div>
              
              {/* Checkbox de Términos */}
              <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input 
                      id="terms" 
                      aria-describedby="terms" 
                      type="checkbox" 
                      className="w-4 h-4 border border-neutral-600 rounded bg-neutral-700 focus:ring-3 focus:ring-blue-600 ring-offset-neutral-800" 
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-light text-neutral-300">Acepto los <span className="font-medium text-blue-500 hover:underline cursor-pointer">Términos y Condiciones</span></label>
                  </div>
              </div>

              {/* Botón de Registro */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
              >
                {loading ? "Creando cuenta..." : "Crear una cuenta"}
              </button>
              
              {/* Enlace de Login */}
              <p className="text-sm font-light text-neutral-400">
                ¿Ya tienes una cuenta? <Link to="/login" className="font-medium text-blue-500 hover:underline">Inicia sesión aquí</Link>
              </p>
            </form>
            {/* --- FIN DEL FORMULARIO --- */}

          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;