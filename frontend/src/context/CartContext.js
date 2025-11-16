import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import API_URL from '../api'; // Asegúrate de que API_URL esté importado

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { authToken } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0); // <-- Estado para el total
  const [itemCount, setItemCount] = useState(0); // <-- Estado para la cantidad

  // --- FUNCIÓN ÚNICA PARA ACTUALIZAR EL ESTADO ---
  // El backend siempre devuelve el carrito actualizado,
  // así que usamos esta función para actualizar el estado de React.
  const updateCartState = (cartData) => {
    setCartItems(cartData.items || []);
    setCartTotal(cartData.total || 0);
    setItemCount((cartData.items || []).reduce((total, item) => total + item.cantidad, 0));
  };

  // --- CARGAR CARRITO DEL BACKEND ---
  const fetchCart = useCallback(async () => {
    if (!authToken) {
      updateCartState({}); // Limpia el carrito si no hay token
      return;
    }
    try {
      const res = await fetch(`${API_URL}/carrito/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        updateCartState(data);
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
    }
  }, [authToken]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]); // Se ejecuta al cargar y cada vez que authToken cambia

  // --- FUNCIONES DEL CARRITO (MODIFICADAS para usar la respuesta de la API) ---
  const addToCart = async (producto) => {
    if (!authToken) return alert('Debes iniciar sesión para agregar productos');
    try {
      const res = await fetch(`${API_URL}/carrito/agregar/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ producto_id: producto.id, cantidad: 1 }),
      });
      const data = await res.json(); // <-- El backend devuelve el carrito actualizado
      if (res.ok) {
        updateCartState(data); // Actualiza el estado con la respuesta
        alert(`${producto.nombre} ha sido añadido al carrito!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const increaseQuantity = async (item) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/carrito/item/${item.id}/actualizar/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: item.cantidad + 1 }),
      });
      const data = await res.json(); // <-- El backend devuelve el carrito actualizado
      if (res.ok) updateCartState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const decreaseQuantity = async (item) => {
    if (!authToken) return;
    const nuevaCantidad = item.cantidad - 1;
    
    // Si la cantidad es 0, usamos la función de eliminar
    if (nuevaCantidad <= 0) return removeFromCart(item);
    
    try {
      const res = await fetch(`${API_URL}/carrito/item/${item.id}/actualizar/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });
      const data = await res.json(); // <-- El backend devuelve el carrito actualizado
      if (res.ok) updateCartState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (item) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/carrito/item/${item.id}/eliminar/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json(); // <-- El backend devuelve el carrito actualizado
      if (res.ok) updateCartState(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- LÓGICA DE VACIAR CARRITO (Fusionada) ---
  const clearCart = async (confirm = true) => {
    if (!authToken) return;
    if (confirm && !window.confirm('¿Seguro que quieres vaciar el carrito?')) return;
    
    try {
      // Usamos Promise.all para borrar todos los items
      // (Una mejor solución a futuro es un endpoint '.../carrito/vaciar/')
      await Promise.all(
        cartItems.map((item) =>
          fetch(`${API_URL}/carrito/item/${item.id}/eliminar/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          })
        )
      );
      // Cuando todas las promesas terminan, volvemos a pedir el carrito (que estará vacío)
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const value = {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    itemCount, // <-- Ahora viene del estado
    totalPrice: cartTotal, // <-- Ahora viene del estado
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};