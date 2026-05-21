import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'retailshop_cart';

export function CartProvider({ children }) {
  // Restore cart from localStorage on first render
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors silently
    }
  }, [cartItems]);

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

  const clearCart = () => {
    setCartItems([]);
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
  };

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
