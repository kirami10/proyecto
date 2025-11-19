import React, { useState, useEffect, useRef } from "react";
import API_URL from "../api";
import toast from 'react-hot-toast';

// --- Funciones Auxiliares ---
const formatCLP = (value) => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue === "") return "";
  return new Intl.NumberFormat("es-CL").format(parseInt(cleanValue, 10));
};
const cleanCLP = (formattedValue) => formattedValue.replace(/\./g, "");

const getImageUrl = (path) => {
  if (!path) return null;
  const BACKEND_BASE_URL = "http://localhost:8000";
  return path.startsWith("http") ? path : `${BACKEND_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
};

function NewPost() {
  const [productos, setProductos] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [activo, setActivo] = useState(true);

  // Estados de Galería para edición
  const [galleryItems, setGalleryItems] = useState([]); 
  const [idsToDelete, setIdsToDelete] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0);

  // ESTADO NUEVO PARA BORRADO DE IMAGEN PRINCIPAL
  const [shouldClearMainImage, setShouldClearMainImage] = useState(false);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/productos/`);
      if (response.ok) {
        setProductos(await response.json());
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newItems = files.map(file => ({
        id: null,
        url: URL.createObjectURL(file),
        file: file,
        isMain: false
      }));
      
      // Si estamos editando y no hay imágenes, el primer archivo pasa a ser el principal.
      // Si ya hay una imagen principal original (isOriginalMain: true), el nuevo archivo la reemplaza en el vista previa.
      if (editingProduct && !galleryItems.length && files.length) {
         newItems[0].isMain = true;
         newItems[0].isOriginalMain = true;
      }
      
      setGalleryItems(prev => [...prev, ...newItems]);
    }
  };

  const nextImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % galleryItems.length); };
  const prevImage = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length); };
  
  const removeCurrentImage = (e) => {
    e.stopPropagation();
    const itemToRemove = galleryItems[currentIndex];

    // 1. Borrado de imágenes accesorias (tienen ID)
    if (itemToRemove.id) {
        setIdsToDelete(prev => [...prev, itemToRemove.id]);
    } 

    // 2. Borrado de imagen principal original (no tiene ID, pero tiene isOriginalMain)
    if (editingProduct && itemToRemove.isOriginalMain) {
        setShouldClearMainImage(true); 
    }

    setGalleryItems(prev => prev.filter((_, i) => i !== currentIndex));
    
    if (currentIndex >= galleryItems.length - 1) {
        setCurrentIndex(Math.max(0, galleryItems.length - 2));
    }
  };
  
  const handleStockChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setStock(value);
  };

  const handlePriceChange = (e) => {
    setPrecio(formatCLP(e.target.value));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    formData.append("precio", cleanCLP(precio));
    formData.append("stock", stock);
    formData.append("activo", activo);
    
    // 1. Enviar IDs a eliminar (JSON)
    if (idsToDelete.length > 0) {
        formData.append("ids_json", JSON.stringify(idsToDelete)); 
    }

    // 2. Determinar si hay un nuevo archivo principal para subir
    const firstItem = galleryItems[0];
    const newMainFileExists = (firstItem && firstItem.file);
    
    if (newMainFileExists) {
        // Si hay un nuevo archivo, lo subimos y este reemplaza cualquier imagen principal existente.
        formData.append("imagen", firstItem.file); 
        
    } else if (editingProduct && shouldClearMainImage) {
        // Si estamos editando, se marcó para borrar la principal (shouldClearMainImage: true), 
        // y NO estamos subiendo un archivo para reemplazarla, enviamos la bandera para limpiar el campo.
        formData.append("clear_main_image", "true"); 
    }

    // 3. Enviar archivos extra (los que no son el primer elemento y tienen 'file')
    galleryItems.forEach((item, index) => {
        if (item.file && index > 0) {
            formData.append("imagenes_extra", item.file);
        }
    });

    const url = editingProduct ? `${API_URL}/productos/${editingProduct.id}/` : `${API_URL}/productos/`;
    const method = editingProduct ? "PUT" : "POST";
    const loadingToast = toast.loading('Guardando...');

    try {
      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success("Guardado correctamente");
        resetForm();
        fetchProductos();
      } else {
        toast.error("Error al guardar");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error("Error de red");
    }
  };


  const handleDelete = (id) => {
    toast((t) => (
      <div className="bg-white text-black p-4 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">Eliminar Producto</p>
        <p className="mb-4 text-sm">Esto desactivará el producto de la tienda.</p>
        <div className="flex gap-2">
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
            onClick={() => {
              executeDelete(id);
              toast.dismiss(t.id);
            }}
          >
            Sí, eliminar
          </button>
          <button
            className="bg-neutral-200 hover:bg-neutral-300 text-black px-3 py-1 rounded-md text-sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const executeDelete = async (id) => {
     try {
       const response = await fetch(`${API_URL}/productos/${id}/`, {
         method: "DELETE",
         headers: { Authorization: `Bearer ${token}` },
       });
       if (response.ok) { 
         fetchProductos();
         toast.success('Producto desactivado');
       } else {
         toast.error("Error al eliminar");
       }
     } catch (error) { toast.error("Error de red"); }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(formatCLP(producto.precio.toString()));
    setStock(producto.stock.toString());
    setActivo(producto.activo);
    setIdsToDelete([]); 
    setShouldClearMainImage(false); // Resetear estado

    // Construir galería inicial
    const initialGallery = [];
    
    if (producto.imagen) {
        // La imagen principal original tiene una bandera para rastrear su eliminación
        initialGallery.push({
            id: null, 
            url: getImageUrl(producto.imagen),
            file: null,
            isMain: true,
            isOriginalMain: true 
        });
    }
    
    if (producto.imagenes && producto.imagenes.length > 0) {
        producto.imagenes.forEach(img => {
            initialGallery.push({
                id: img.id, 
                url: getImageUrl(img.imagen),
                file: null,
                isMain: false
            });
        });
    }

    setGalleryItems(initialGallery);
    setCurrentIndex(0);
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setActivo(true);
    setGalleryItems([]);
    setIdsToDelete([]);
    setShouldClearMainImage(false); // Resetear estado
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full bg-neutral-800 border border-neutral-700 py-2 pl-8 pr-4 rounded focus:outline-none focus:border-blue-500 transition"
                        value={precio}
                        onChange={handlePriceChange} 
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
                  <div className="flex items-center gap-3 bg-neutral-800 p-3 rounded border border-neutral-700">
                      <input type="checkbox" id="activo" className="w-5 h-5" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                      <label htmlFor="activo" className="text-sm text-white cursor-pointer">Producto Activo</label>
                  </div>
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

          {/* --- CARRUSEL DE PREVIEW --- */}
          <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-800 flex flex-col items-center justify-center sticky top-28">
               <h3 className="text-lg font-medium mb-4 text-neutral-300">Imágenes ({galleryItems.length})</h3>
               
               <div onClick={() => fileInputRef.current.click()} className="relative w-full aspect-square bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-700 flex items-center justify-center overflow-hidden mb-4 cursor-pointer hover:border-blue-500 transition group">
                   {galleryItems.length > 0 ? (
                       <>
                           <img src={galleryItems[currentIndex].url} alt={`Preview ${currentIndex}`} className="w-full h-full object-cover" />
                           {galleryItems.length > 1 && (
                               <>
                                   <button type="button" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition backdrop-blur-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                   </button>
                                   <button type="button" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition backdrop-blur-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                   </button>
                                   <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm">{currentIndex + 1} / {galleryItems.length}</div>
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
               {galleryItems.length > 0 && (
                  <button onClick={removeCurrentImage} className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                     Eliminar esta imagen
                  </button>
               )}
          </div>
        </div>

        {/* --- LISTA DE INVENTARIO (TABLA) --- */}
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
                    <tr 
                        key={prod.id} 
                        className={`border-b border-neutral-800 transition ${!prod.activo ? 'bg-red-900/10 opacity-60' : 'hover:bg-neutral-800/30'}`}
                    >
                      <td className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-700">
                             {prod.imagen ? <img src={getImageUrl(prod.imagen)} alt={prod.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Sin foto</div>}
                        </div>
                        <div>
                             <div className="flex items-center gap-2">
                                <p className="font-semibold text-white">{prod.nombre}</p>
                                {!prod.activo && <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">INACTIVO</span>}
                             </div>
                             <p className="text-sm text-neutral-500 truncate max-w-xs">{prod.descripcion || "Sin descripción"}</p>
                        </div>
                      </td>
                      <td className="p-4 text-neutral-300 font-medium">
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
                            
                            {prod.activo && (
                                <button onClick={() => handleDelete(prod.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition" title="Eliminar (Desactivar)">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                            {!prod.activo && (
                                <button onClick={() => handleEdit({...prod, activo: true})} className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg transition" title="Restaurar (Activar)">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            )}

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