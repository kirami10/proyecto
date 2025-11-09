import React, { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "react-qr-code"; // 1. Importar la librería
import API_URL from "../api";

// Función auxiliar para formatear el teléfono al mostrarlo
const formatPhoneNumberDisplay = (phone) => {
  if (!phone) return "N/A";
  if (phone.startsWith("+56") && phone.length >= 11) {
     return `${phone.slice(0, 3)} ${phone.slice(3, 4)} ${phone.slice(4, 8)} ${phone.slice(8)}`;
  }
  return phone;
};

function Profile({ token }) {
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Perfil recibido:", data);
        setProfile(data);
        setImageError(false);
      } else {
        console.error("Error al obtener perfil: No autorizado");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token, fetchProfile]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(`${API_URL}/profile/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        alert("Foto actualizada");
        fetchProfile();
      } else {
        alert("Error al subir imagen");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current.click();

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    const BACKEND_BASE_URL = "http://localhost:8000";
    const path = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
    return `${BACKEND_BASE_URL}${path}`;
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <p className="text-xl animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  // 2. Preparar los datos para el QR
  // Puedes formatearlo como quieras. Aquí un ejemplo simple de texto:
  const qrData = `Nombre: ${profile.nombre} ${profile.apellidos}\nRUT: ${profile.rut}\nEmail: ${profile.email}\nTel: ${profile.numero_personal}\nEmergencia: ${profile.numero_emergencia}`;

  const ProfileField = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-neutral-700 last:border-b-0">
      <span className="text-neutral-400 font-medium mb-1 sm:mb-0">{label}:</span>
      <span className="text-white font-semibold text-right break-words sm:max-w-[60%]">
        {value || "N/A"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 p-8 rounded-xl shadow-xl shadow-black/40">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600/50 shadow-lg shadow-blue-900/30 flex items-center justify-center bg-neutral-800">
               {profile.avatar && !imageError ? (
                   <img
                     src={getImageUrl(profile.avatar)}
                     alt="Avatar"
                     className="w-full h-full object-cover"
                     onError={(e) => {
                         console.error("Error cargando imagen:", e.target.src);
                         setImageError(true);
                     }}
                   />
               ) : (
                  <span className="text-white text-5xl font-bold select-none">
                    {profile.nombre ? profile.nombre.charAt(0).toUpperCase() : "?"}
                  </span>
               )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-white text-sm font-semibold">
                    {uploading ? "Subiendo..." : "Cambiar Foto"}
                </span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide text-center mt-4">
            {profile.nombre} {profile.apellidos}
          </h2>
          <p className="text-neutral-400 mt-1">@{profile.username}</p>
        </div>

        <div className="space-y-1 mb-8">
          <ProfileField label="Correo Electrónico" value={profile.email} />
          <ProfileField label="RUT" value={profile.rut} />
          <ProfileField label="Teléfono Personal" value={formatPhoneNumberDisplay(profile.numero_personal)} />
          <ProfileField label="Contacto de Emergencia" value={formatPhoneNumberDisplay(profile.numero_emergencia)} />
        </div>

        {/* 3. Renderizar el Código QR */}
        <div className="flex flex-col items-center pt-6 border-t border-neutral-700">
            <h3 className="text-white font-semibold mb-4">Tu Código QR</h3>
            <div className="p-4 bg-white rounded-xl">
                <QRCode
                    value={qrData}
                    size={150}
                    level={"H"} // Nivel de corrección de errores alto
                />
            </div>
            <p className="text-neutral-500 text-sm mt-2 text-center">
                Escanea para compartir tus datos
            </p>
        </div>

      </div>
    </div>
  );
}

export default Profile;