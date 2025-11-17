import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import API_URL from '../api';
import toast from 'react-hot-toast'; // <-- AÑADIR IMPORT

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { authToken } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const updateCartState = (cartData) => {
    setCartItems(cartData.items || []);
    setCartTotal(cartData.total || 0);
    setItemCount((cartData.items || []).reduce((total, item) => total + item.cantidad, 0));
  };

  const fetchCart = useCallback(async () => {
    if (!authToken) {
      updateCartState({}); 
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
  }, [fetchCart]); 

  const addToCart = async (producto) => {
    if (!authToken) {
      toast.error('Debes iniciar sesión para agregar productos'); // <-- MODIFICADO
      return;
    }
    try {
      const res = await fetch(`${API_URL}/carrito/agregar/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ producto_id: producto.id, cantidad: 1 }),
      });
      const data = await res.json(); 
      if (res.ok) {
        updateCartState(data); 
        toast.success(`${producto.nombre} añadido al carrito`); // <-- MODIFICADO
      } else {
        toast.error('Error al añadir producto'); // <-- MODIFICADO
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión'); // <-- MODIFICADO
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
      const data = await res.json();
      if (res.ok) updateCartState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const decreaseQuantity = async (item) => {
    if (!authToken) return;
    const nuevaCantidad = item.cantidad - 1;
    
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
      const data = await res.json();
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
      const data = await res.json();
      if (res.ok) updateCartState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async (confirm = true) => {
    if (!authToken) return;
    
    // --- MODIFICADO: Usamos toast.custom para el confirm ---
    if (confirm) {
      toast((t) => (
        <div className="bg-white text-black p-4 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">¿Vaciar Carrito?</p>
          <p className="mb-4">¿Seguro que quieres eliminar todos los items?</p>
          <div className="flex gap-2">
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => {
                executeClearCart();
                toast.dismiss(t.id);
              }}
            >
              Sí, vaciar
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
    } else {
      executeClearCart();
    }
  };
  
  // Función interna para no duplicar código
  const executeClearCart = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/carrito/vaciar/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        updateCartState(data);
        toast.success('Carrito vaciado'); // <-- MODIFICADO
      } else {
        toast.error('Error al vaciar el carrito'); // <-- MODIFICADO
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión'); // <-- MODIFICADO
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---

  const value = {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    itemCount,
    totalPrice: cartTotal,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};