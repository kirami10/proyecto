import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

function AdminBlog() {
  const { authToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagen, setImagen] = useState(null);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/blog/`);
      setPosts(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("contenido", contenido);
    if (imagen) formData.append("imagen", imagen);

    try {
      await axios.post(`${API_URL}/blog/`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Publicación creada");
      setTitulo("");
      setContenido("");
      setImagen(null);
      fetchPosts();
    } catch (error) {
      console.log(error);
      toast.error("Error al crear publicación");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/blog/${id}/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success("Publicación eliminada");
      fetchPosts();
    } catch (err) {
      console.log(err);
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Administrador del Blog</h1>

      {/* FORMULARIO */}
      <form
        onSubmit={handleCreate}
        className="bg-neutral-800 p-4 rounded-lg mb-10"
      >
        <h2 className="text-xl font-semibold mb-4">Crear publicación</h2>

        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-neutral-900 text-white"
          required
        />

        <textarea
          placeholder="Contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-neutral-900 text-white"
          required
        />

        <input
          type="file"
          onChange={(e) => setImagen(e.target.files[0])}
          className="w-full mb-3 text-white"
        />

        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
          Publicar
        </button>
      </form>

      {/* LISTA DE POSTS */}
      <h2 className="text-xl font-bold mb-3">Publicaciones existentes</h2>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-neutral-800 p-4 rounded flex justify-between items-center"
          >
            <div>
              <h3 className="text-lg font-semibold">{post.titulo}</h3>
              <p className="text-neutral-400 text-sm">{post.fecha_publicacion}</p>
            </div>

            <button
              onClick={() => handleDelete(post.id)}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBlog;
