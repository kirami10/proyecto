import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // --- FUNCIONES DEL CARRITO ---

  const addToCart = (producto) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find((item) => item.id === producto.id);
      if (itemExists) {
        return prevItems.map((item) =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + 1 } // Aumenta cantidad
            : item
        );
      } else {
        return [...prevItems, { ...producto, quantity: 1 }]; // Agrega nuevo
      }
    });
    alert(`${producto.nombre} ha sido añadido al carrito!`);
  };

  // NUEVA: Aumentar cantidad en 1
  const increaseQuantity = (id) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // NUEVA: Disminuir cantidad en 1 (no baja de 1)
  const decreaseQuantity = (id) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  // NUEVA: Eliminar un item por completo
  const removeFromCart = (id) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== id)
    );
  };

  // NUEVA: Vaciar el carrito
  const clearCart = () => {
    if (window.confirm("¿Seguro que quieres vaciar el carrito?")) {
      setCartItems([]);
    }
  };

  // --- CÁLCULOS DERIVADOS ---

  // Cantidad total de items (para el ícono del navbar)
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Precio total del carrito
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.precio * item.quantity,
    0
  );

  // --- VALOR DEL CONTEXTO ---
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    itemCount,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};