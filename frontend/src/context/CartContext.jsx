import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Persistent cart using localStorage
    const saved = localStorage.getItem("amazon_now_cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("amazon_now_cart", JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (i) => i.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += item.quantity || 1;
        // Keep image if existing item didn't have one but new one does
        if (item.image && !updated[existingIdx].image) {
          updated[existingIdx].image = item.image;
        }
        return updated;
      } else {
        return [
          ...prevCart,
          {
            name: item.name,
            quantity: item.quantity || 1,
            price: Number(item.price) || 1.99,
            image: item.image || null,
          },
        ];
      }
    });
  };

  // Add multiple items (e.g. from AI generator or scan list)
  const addMultipleToCart = (items) => {
    setCart((prevCart) => {
      let updated = [...prevCart];
      items.forEach((item) => {
        const existingIdx = updated.findIndex(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );

        if (existingIdx > -1) {
          updated[existingIdx].quantity += item.quantity || 1;
          if (item.image && !updated[existingIdx].image) {
            updated[existingIdx].image = item.image;
          }
        } else {
          updated.push({
            name: item.name,
            quantity: item.quantity || 1,
            price: Number(item.price) || 1.99,
            image: item.image || null,
          });
        }
      });
      return updated;
    });
  };

  // Update item quantity
  const updateQuantity = (name, quantity) => {
    if (quantity < 1) {
      removeFromCart(name);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.name.toLowerCase() === name.toLowerCase()
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Remove item
  const removeFromCart = (name) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.name.toLowerCase() !== name.toLowerCase())
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addMultipleToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
