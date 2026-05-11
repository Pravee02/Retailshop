import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity, unit) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.unit === unit);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.unit === unit
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, unit }];
    });
  };

  const removeFromCart = (productId, unit) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.unit === unit)));
  };

  const updateQuantity = (productId, unit, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, unit);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId && item.unit === unit
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + (item.product.pricePerUnit * item.quantity);
  }, 0);

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
