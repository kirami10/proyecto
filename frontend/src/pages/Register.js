import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import toast from 'react-hot-toast'; // <-- AÑADIR IMPORT

// --- Funciones Auxiliares (sin cambios) ---
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

const PhoneInput = ({ value, onChange, placeholder }) => (
  <div className="flex items-center bg-neutral-800 border border-neutral-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
    <span className="pl-4 pr-2 text-neutral-400 select-none">+56</span>
    <input
      className="w-full bg-neutral-800 text-white px-2 py-2 focus:outline-none"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={11}
      required
    />
  </div>
);

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
  const [loading, setLoading] = useState(false); // <-- AÑADIDO

  const navigate = useNavigate();

  const handleNameChange = (e) => setNombre(formatName(e.target.value));
  const handleLastNameChange = (e) => setApellidos(formatName(e.target.value));
  const handleRutChange = (e) => setRut(formatRut(e.target.value));
  const handlePersonalPhoneChange = (e) =>
    setNumeroPersonal(formatPhoneNumber(e.target.value));
  const handleEmergencyPhoneChange = (e) =>
    setNumeroEmergencia(formatPhoneNumber(e.target.value));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // --- MODIFICADO: Reemplazamos todos los alert() con toast.error() ---
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
    // --- FIN MODIFICACIÓN ---

    setLoading(true); // <-- AÑADIDO
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
        toast.success("Usuario registrado correctamente"); // <-- MODIFICADO
        navigate("/login");
      } else {
        const data = await response.json();
        // --- MODIFICADO: Mostrar errores de la API ---
        if (data.rut) {
          toast.error(data.rut[0]);
        } else if (data.username) {
          toast.error(data.username[0]);
        } else {
          toast.error("Error al registrar: " + (data.detail || JSON.stringify(data)));
        }
        // --- FIN MODIFICACIÓN ---
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión."); // <-- MODIFICADO
    }
    setLoading(false); // <-- AÑADIDO
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700 p-8 rounded-xl shadow-xl shadow-black/40"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center tracking-wide">
          Registro
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <input
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre"
            value={nombre}
            onChange={handleNameChange}
            required
          />
          <input
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Apellidos"
            value={apellidos}
            onChange={handleLastNameChange}
            required
          />
          <input
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="RUT (Ej: 12.345.678-K)"
            value={rut}
            onChange={handleRutChange}
            maxLength={12}
            required
          />

          <PhoneInput
            value={numeroPersonal}
            onChange={handlePersonalPhoneChange}
            placeholder="Número Personal (Ej: 9 1234 5678)"
          />
          <PhoneInput
            value={numeroEmergencia}
            onChange={handleEmergencyPhoneChange}
            placeholder="Número de Emergencia"
          />

          <input
            type="password"
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="bg-neutral-800 border border-neutral-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirmar Contraseña"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading} // <-- AÑADIDO
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition py-2 rounded-lg text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrarse"} {/* <-- MODIFICADO */}
        </button>
      </form>
    </div>
  );
}

export default Register;