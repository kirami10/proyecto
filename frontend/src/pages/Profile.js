import React, { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import API_URL from "../api";

// --- Funciones de Formato y Validación (Reutilizadas y adaptadas) ---

// Formatea nombres: Capitaliza cada palabra, solo letras y espacios.
const formatName = (name) => {
  if (!name) return "";
  let value = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  return value.replace(/\b\w/g, (l) => l.toUpperCase());
};

// Formatea el número INTERNO (los 9 dígitos después del +56) para edición
// Ej: entrada "9123" -> salida "9 123"
const formatInternalPhone = (phone) => {
  if (!phone) return "";
  let value = phone.replace(/\D/g, ""); // Solo números
  if (value.length > 9) value = value.slice(0, 9); // Máximo 9 dígitos

  if (value.length > 5) {
    return `${value.slice(0, 1)} ${value.slice(1, 5)} ${value.slice(5)}`;
  } else if (value.length > 1) {
    return `${value.slice(0, 1)} ${value.slice(1)}`;
  }
  return value;
};

// Formatea el número COMPLETO para mostrarlo cuando NO se está editando
// Asume entrada +569XXXXXXXX -> Salida visual: +56 9 XXXX XXXX
const formatFullPhoneDisplay = (fullPhone) => {
  if (!fullPhone) return "N/A";
  const cleaned = fullPhone.replace(/\D/g, "");
  // Si tiene el largo esperado de un número chileno (56 + 9 dígitos = 11)
  if (cleaned.startsWith("56") && cleaned.length >= 11) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return fullPhone; // Devolver original si no coincide con el formato
};


// --- Componente ProfileField (MOVIDO FUERA para evitar pérdida de foco) ---
const ProfileField = ({ label, name, value, onChange, type = "text", isEditing, readOnly = false }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 border-b border-neutral-800 last:border-b-0 group">
      <label className="text-neutral-400 font-medium mb-1 sm:mb-0 flex-shrink-0 sm:w-1/3">
        {label}:
      </label>
      <div className="sm:w-2/3 text-right">
        {isEditing && !readOnly ? (
          type === "phone" ? (
             // Input especial para teléfonos con +56 fijo
             <div className="flex items-center justify-end">
                 <span className="text-neutral-500 mr-2 select-none">+56</span>
                 <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="9 1234 5678"
                    maxLength={11} // 9 dígitos + 2 espacios
                    className="w-full sm:w-auto bg-neutral-800 border border-neutral-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-right font-mono"
                 />
             </div>
          ) : (
              // Input estándar para texto/email
              <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-right"
              />
          )
        ) : (
          // Modo Lectura
          <span className={`text-white font-semibold break-all ${readOnly && isEditing ? 'text-neutral-500 cursor-not-allowed' : ''}`}>
            {type === "phone" && !isEditing ? formatFullPhoneDisplay(value) : (value || <span className="text-neutral-600 italic">No especificado</span>)}
          </span>
        )}
      </div>
    </div>
  );
};


// --- Componente Principal ---
function Profile({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setImageError(false);
      } else {
        console.error("Error al obtener perfil");
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token, fetchProfile]);

  // --- Manejador de Cambios en Inputs con Validación ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplicamos validaciones según el campo
    if (name === "nombre" || name === "apellidos") {
        formattedValue = formatName(value);
    } else if (name === "numero_personal" || name === "numero_emergencia") {
        formattedValue = formatInternalPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // --- Activar/Desactivar Modo Edición ---
  const toggleEdit = () => {
    if (!isEditing) {
      // Al entrar a editar, preparamos los datos.
      // Para los teléfonos, quitamos el '+56' si existe, para que el usuario solo edite los 9 dígitos.
      const preparePhoneForEdit = (fullPhone) => {
          if (!fullPhone) return "";
          let cleaned = fullPhone.replace(/\D/g, "");
          if (cleaned.startsWith("56") && cleaned.length >= 11) {
               // Extraemos solo los 9 dígitos finales y los formateamos visualmente
               return formatInternalPhone(cleaned.slice(2));
          }
          return formatInternalPhone(cleaned); // Fallback si no tenía +56
      };

      setFormData({
        nombre: profile.nombre || "",
        apellidos: profile.apellidos || "",
        email: profile.email || "",
        // Preparamos los teléfonos para que solo muestren la parte editable (los 9 dígitos)
        numero_personal: preparePhoneForEdit(profile.numero_personal),
        numero_emergencia: preparePhoneForEdit(profile.numero_emergencia),
      });
    }
    setIsEditing(!isEditing);
  };

  // --- Guardar Perfil ---
  const handleSaveProfile = async () => {
    // Antes de enviar, reconstruimos los números completos con +56
    const finalizePhoneForSubmit = (internalPhone) => {
        const digits = internalPhone.replace(/\D/g, "");
        if (digits.length === 9) {
            return "+56" + digits;
        }
        return internalPhone; // Enviamos tal cual si no está completo (el backend podría rechazarlo si valida estricto)
    };

    const dataToSend = {
        ...formData,
        numero_personal: finalizePhoneForSubmit(formData.numero_personal),
        numero_emergencia: finalizePhoneForSubmit(formData.numero_emergencia)
    };

    // Validación simple antes de enviar
    if (formData.numero_personal && formData.numero_personal.replace(/\D/g, "").length !== 9) {
        alert("El teléfono personal debe tener 9 dígitos.");
        return;
    }
     if (formData.numero_emergencia && formData.numero_emergencia.replace(/\D/g, "").length !== 9) {
        alert("El teléfono de emergencia debe tener 9 dígitos.");
        return;
    }

    try {
      const response = await fetch(`${API_URL}/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        alert("Perfil actualizado correctamente");
        setIsEditing(false);
        fetchProfile();
      } else {
        const errData = await response.json();
        alert("Error al actualizar: " + JSON.stringify(errData));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  // ... (Manejadores de imagen getImageUrl, handleFileChange, handleAvatarClick IGUAL que antes) ...
  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const data = new FormData();
      data.append("avatar", file);
      try {
          const response = await fetch(`${API_URL}/profile/`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
              body: data,
          });
          if (response.ok) { fetchProfile(); }
          else { alert("Error al subir imagen"); }
      } catch (error) { console.error(error); alert("Error de red"); }
      finally { setUploading(false); }
  };
  const handleAvatarClick = () => !isEditing && fileInputRef.current.click();
  const getImageUrl = (path) => {
      if (!path) return null;
      const BACKEND_BASE_URL = "http://localhost:8000";
      return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl animate-pulse">
            {/* Skeleton sencillo */}
            <div className="flex flex-col items-center mb-8 space-y-4">
                <div className="w-32 h-32 bg-neutral-800 rounded-full"></div>
                <div className="h-6 bg-neutral-800 rounded w-1/2"></div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-neutral-800 rounded"></div>)}
            </div>
        </div>
      </div>
    );
  }

  const qrData = `Nombre: ${profile.nombre} ${profile.apellidos}\nRUT: ${profile.rut}\nEmail: ${profile.email}\nTel: ${profile.numero_personal}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-lg relative">
        {/* Botones de Acción Flotantes */}
        <div className="absolute top-4 right-4 z-10">
          {!isEditing ? (
            <button onClick={toggleEdit} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white p-2 rounded-full transition-all shadow-lg active:scale-95" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={toggleEdit} className="bg-red-900/30 text-red-400 hover:bg-red-900/50 p-2 rounded-full transition-all" title="Cancelar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
              <button onClick={handleSaveProfile} className="bg-green-900/30 text-green-400 hover:bg-green-900/50 p-2 rounded-full transition-all" title="Guardar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <div className={`relative group ${!isEditing ? "cursor-pointer" : ""}`} onClick={handleAvatarClick}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={isEditing} />
              <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${isEditing ? "border-neutral-700 opacity-50" : "border-blue-500/30 shadow-lg"} flex items-center justify-center bg-neutral-800 transition-all duration-300`}>
                {profile.avatar && !imageError ? (
                  <img src={getImageUrl(profile.avatar)} alt="Avatar" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                ) : (
                  <span className="text-white text-6xl font-bold select-none">{profile.nombre ? profile.nombre.charAt(0).toUpperCase() : "?"}</span>
                )}
              </div>
              {!isEditing && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-sm font-semibold tracking-wider">{uploading ? "Subiendo..." : "Cambiar Foto"}</span>
                </div>
              )}
            </div>
            <div className="text-center mt-4">
              {!isEditing ? (
                <>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{profile.nombre} {profile.apellidos}</h2>
                  <p className="text-blue-400 font-medium mt-1">@{profile.username}</p>
                </>
              ) : (
                <p className="text-neutral-500 italic mt-4">Editando información...</p>
              )}
            </div>
          </div>

          <div className="space-y-1 mb-8 px-2">
            {/* Pasamos las props necesarias a ProfileField, que ahora vive FUERA del componente principal */}
            <ProfileField label="Nombre" name="nombre" value={isEditing ? formData.nombre : profile.nombre} onChange={handleInputChange} isEditing={isEditing} />
            <ProfileField label="Apellidos" name="apellidos" value={isEditing ? formData.apellidos : profile.apellidos} onChange={handleInputChange} isEditing={isEditing} />
            <ProfileField label="Correo" name="email" value={isEditing ? formData.email : profile.email} onChange={handleInputChange} type="email" isEditing={isEditing} />
            <ProfileField label="RUT" name="rut" value={profile.rut} readOnly={true} isEditing={isEditing} />
            
            {/* Para teléfonos, usamos type="phone" para activar el input especial con +56 */}
            <ProfileField label="Tel. Personal" name="numero_personal" value={isEditing ? formData.numero_personal : profile.numero_personal} onChange={handleInputChange} type="phone" isEditing={isEditing} />
            <ProfileField label="Emergencia" name="numero_emergencia" value={isEditing ? formData.numero_emergencia : profile.numero_emergencia} onChange={handleInputChange} type="phone" isEditing={isEditing} />
          </div>

          {!isEditing && (
            <div className="flex flex-col items-center pt-6 border-t border-neutral-800/50 transition-opacity duration-500 ease-in-out">
              <div className="p-3 bg-white rounded-xl shadow-inner">
                <QRCode value={qrData} size={120} level={"M"} />
              </div>
              <p className="text-neutral-500 text-xs mt-3 uppercase tracking-widest font-semibold">Compartir Contacto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;