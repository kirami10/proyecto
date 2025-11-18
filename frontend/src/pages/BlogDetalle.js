import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function BlogDetalle() {
    const { id } = useParams();
    const [post, setPost] = useState(null);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/blog/${id}/`)
            .then(res => res.json())
            .then(data => setPost(data))
            .catch(err => console.error('Error:', err));
    }, [id]);

    if (!post) return <p className='text-white text-center mt-10'>Cargando...</p>;

    return (
        <div className='max-w-3xl mx-auto mt-10 px-4'>
            <Link to='/blog' className='text-blue-400 hover:underline'>
                ← Volver al Blog
            </Link>

            <h1 className='text-3xl font-bold mt-4 text-white'>{post.titulo}</h1>

            <p className='text-gray-400 text-sm mt-1'>
                Publicado el {new Date(post.fecha_publicacion).toLocaleDateString()}
            </p>

            {post.imagen && (
                <img
                    src={post.imagen}
                    alt='imagen blog'
                    className='w-full rounded-xl mt-4 shadow'
                />
            )}

            <p className='text-gray-300 mt-6 whitespace-pre-wrap leading-relaxed'>
                {post.contenido}
            </p>
        </div>
    );
}
