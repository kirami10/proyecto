import React, { useState, useEffect, useRef } from "react";
import API_URL from "../api";

// --- Funciones Auxiliares ---

// NUEVO: Formatea un número como moneda chilena (ej: 10000 -> 10.000)
const formatCLP = (value) => {
  // 1. Eliminar cualquier caracter que no sea dígito
  const cleanValue = value.replace(/\D/g, "");

  // 2. Si está vacío, devolver string vacío
  if (cleanValue === "") return "";

  // 3. Formatear con puntos de miles usando Intl.NumberFormat
  // 'es-CL' usa puntos para miles automáticamente.
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};

// NUEVO: Limpia el formato CLP para obtener el número entero (ej: 10.000 -> 10000)
const cleanCLP = (formattedValue) => {
  return formattedValue.replace(/\./g, "");
};


function NewPost() {
  const [productos, setProductos] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState(""); // Guardaremos el valor formateado aquí para mostrarlo
  const [stock, setStock] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/productos/`);
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // ... (Manejo de imágenes igual que antes) ...
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };
  const nextImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % previewUrls.length); };
  const prevImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length); };
  const removeCurrentImage = (e) => {
    e.stopPropagation();
    setSelectedFiles((prev) => prev.filter((_, i) => i !== currentIndex));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== currentIndex));
    if (currentIndex >= previewUrls.length - 1) setCurrentIndex(Math.max(0, previewUrls.length - 2));
  };

  // Handler para Stock (solo números, sin formato especial)
  const handleStockChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setStock(value);
  };

  // NUEVO: Handler específico para Precio con formato CLP en tiempo real
  const handlePriceChange = (e) => {
    setPrecio(formatCLP(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    // IMPORTANTE: Limpiamos el precio (quitamos puntos) antes de enviar al backend
    formData.append("precio", cleanCLP(precio));
    formData.append("stock", stock);
    if (selectedFiles.length > 0) {
      formData.append("imagen", selectedFiles[0]);
    }

    const url = editingProduct
      ? `${API_URL}/productos/${editingProduct.id}/`
      : `${API_URL}/productos/`;
    const method = editingProduct ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        alert(editingProduct ? "Producto actualizado" : "Producto creado");
        resetForm();
        fetchProductos();
      } else {
        alert("Error al guardar producto");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      const response = await fetch(`${API_URL}/productos/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchProductos();
      else alert("Error al eliminar");
    } catch (error) { console.error(error); }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    // Al cargar para editar, formateamos el precio que viene del backend
    setPrecio(formatCLP(producto.precio.toString()));
    setStock(producto.stock.toString());
    if (producto.imagen) {
        setPreviewUrls([producto.imagen]);
        setSelectedFiles([]);
    } else {
        setPreviewUrls([]);
        setSelectedFiles([]);
    }
    setCurrentIndex(0);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCurrentIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center tracking-wide">
          Gestión de Productos
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          {/* --- FORMULARIO --- */}
          <div className="lg:col-span-2 bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800">
            <h2 className="text-xl font-semibold mb-6 text-blue-400 border-b border-neutral-800 pb-2">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                  <label className="block text-neutral-400 text-sm mb-1">Nombre del Producto</label>
                  <input
                    className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded focus:outline-none focus:border-blue-500 transition"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
              </div>

              <div>
                  <label className="block text-neutral-400 text-sm mb-1">Precio (CLP)</label>
                  <div className="relative">
                      {/* Símbolo $ fijo a la izquierda */}
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full bg-neutral-800 border border-neutral-700 py-2 pl-8 pr-4 rounded focus:outline-none focus:border-blue-500 transition"
                        value={precio}
                        onChange={handlePriceChange} // Usamos el nuevo handler con formato
                        placeholder="Ej: 10.000"
                        required
                      />
                  </div>
              </div>
              <div>
                   <label className="block text-neutral-400 text-sm mb-1">Stock Inicial</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded focus:outline-none focus:border-blue-500 transition"
                    value={stock}
                    onChange={handleStockChange}
                    placeholder="Ej: 50"
                    required
                  />
              </div>

              <div className="md:col-span-2">
                 <label className="block text-neutral-400 text-sm mb-1">Descripción</label>
                <textarea
                  className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded focus:outline-none focus:border-blue-500 transition resize-none"
                  rows="4"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition shadow-md hover:shadow-blue-900/20">
                  {editingProduct ? "Actualizar Producto" : "Guardar Producto"}
                </button>
                {editingProduct && (
                  <button type="button" onClick={resetForm} className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-lg font-semibold transition">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* --- CARRUSEL DE PREVIEW (Sin cambios en esta iteración) --- */}
          <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 flex flex-col items-center justify-center sticky top-6">
             <h3 className="text-lg font-medium mb-4 text-neutral-300">Imágenes ({previewUrls.length})</h3>
             <div className="relative w-full aspect-square bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-700 flex items-center justify-center overflow-hidden mb-4 cursor-pointer hover:border-blue-500 transition group" onClick={() => fileInputRef.current.click()}>
                {previewUrls.length > 0 ? (
                    <>
                        <img src={previewUrls[currentIndex]} alt={`Preview ${currentIndex}`} className="w-full h-full object-cover" />
                        {previewUrls.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm">{currentIndex + 1} / {previewUrls.length}</div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="text-center p-4 group-hover:text-blue-400 transition">
                        <span className="text-4xl mb-2 block">📷</span>
                        <p className="text-sm text-neutral-500">Click para agregar imágenes</p>
                    </div>
                )}
             </div>
             {previewUrls.length > 0 && (
                 <button onClick={removeCurrentImage} className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Eliminar esta imagen
                 </button>
             )}
          </div>
        </div>

        {/* --- LISTA DE INVENTARIO --- */}
        <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800">
          <h2 className="text-xl font-semibold mb-6 text-blue-400 border-b border-neutral-800 pb-2">Inventario Actual</h2>
          {productos.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No hay productos registrados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-neutral-400 text-sm uppercase tracking-wider border-b border-neutral-800">
                    <th className="p-4 font-medium">Producto</th>
                    <th className="p-4 font-medium">Precio</th>
                    <th className="p-4 font-medium text-center">Stock</th>
                    <th className="p-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => (
                    <tr key={prod.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition duration-150">
                      <td className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-700">
                             {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Sin foto</div>}
                        </div>
                        <div>
                             <p className="font-semibold text-white">{prod.nombre}</p>
                             <p className="text-sm text-neutral-500 truncate max-w-xs">{prod.descripcion || "Sin descripción"}</p>
                        </div>
                      </td>
                      <td className="p-4 text-neutral-300 font-medium">
                        {/* Usamos formatCLP también aquí para consistencia en la lista */}
                        ${formatCLP(prod.precio.toString())}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${prod.stock > 5 ? 'bg-green-900/30 text-green-400' : prod.stock > 0 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>{prod.stock} un.</span>
                      </td>
                      <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(prod)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition" title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(prod.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition" title="Eliminar">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewPost;