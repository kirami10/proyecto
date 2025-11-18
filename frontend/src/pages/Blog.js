import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Blog() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/blog/')
            .then(res => res.json())
            .then(data => setPosts(data))
            .catch(err => console.error('Error cargando posts:', err));
    }, []);

    return (
        <div className='max-w-5xl mx-auto mt-10 px-4'>
            <h1 className='text-3xl font-bold mb-6 text-white'>Blog</h1>

            <div className='grid md:grid-cols-2 gap-6'>
                {posts.map(post => (
                    <Link
                        key={post.id}
                        to={`/blog/${post.id}`}
                        className='bg-gray-800 rounded-xl p-4 shadow hover:shadow-lg transition'
                    >
                        {post.imagen && (
                            <img
                                src={post.imagen}
                                alt='imagen blog'
                                className='w-full h-48 object-cover rounded-md mb-4'
                            />
                        )}

                        <h2 className='text-xl font-semibold text-white'>{post.titulo}</h2>
                        <p className='text-gray-400 text-sm mt-1'>
                            {new Date(post.fecha_publicacion).toLocaleDateString()}
                        </p>

                        <p className='text-gray-300 mt-2 line-clamp-3'>
                            {post.contenido}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
