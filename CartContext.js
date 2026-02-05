// CartContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // بارگذاری سبد خرید از AsyncStorage هنگام mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('cart');
        if (storedCart) setCart(JSON.parse(storedCart));
      } catch (error) {
        console.log('خطا در بارگذاری سبد خرید:', error.message);
      }
    };
    loadCart();
  }, []);

  // ذخیره کردن سبد خرید در AsyncStorage
  const saveCart = async (newCart) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    } catch (error) {
      console.log('خطا در ذخیره سبد خرید:', error.message);
    }
  };

  // افزودن آیتم به سبد یا به‌روزرسانی اگر وجود دارد
  // در CartContext.js - تابع addToCart
const addToCart = (product) => {
  setCart(prevCart => {
    // بررسی وجود محصول در سبد خرید بر اساس Code
    const existingProductIndex = prevCart.findIndex(item => 
      item.Code === product.Code
    );

    let newCart;
    
    if (existingProductIndex !== -1) {
      // اگر محصول وجود دارد، آن را به‌روزرسانی کن - همه فیلدها رو آپدیت کن
      newCart = prevCart.map((item, index) => 
        index === existingProductIndex ? {
          ...item, // مقادیر قبلی رو نگه دار
          ...product, // با مقادیر جدید جایگزین کن
          countMbna: parseFloat(product.countMbna) || 0,
          countSlave: parseFloat(product.countSlave) || 0,
          totalCount: parseFloat(product.totalCount) || 0,
          totalPrice: parseFloat(product.totalPrice) || (parseFloat(product.totalCount) || 0) * parseFloat(product.Price || product.PriceF1 || 0),
          Image: product.Image || item.Image // اگر عکس جدید نیومد، عکس قبلی رو نگه دار
        } : item
      );
    } else {
      // اگر محصول وجود ندارد، جدید اضافه کن
      newCart = [...prevCart, {
        ...product,
        countMbna: parseFloat(product.countMbna) || 0,
        countSlave: parseFloat(product.countSlave) || 0,
        totalCount: parseFloat(product.totalCount) || (parseFloat(product.countMbna) * parseFloat(product.Mbna || 0) + parseFloat(product.countSlave)),
        totalPrice: parseFloat(product.totalPrice) || (parseFloat(product.totalCount) || 0) * parseFloat(product.Price || product.PriceF1 || 0),
        Image: product.Image || null
      }];
    }
    
    saveCart(newCart);
    return newCart;
  });
};

  // حذف آیتم از سبد
  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    saveCart(newCart);
  };

  // بروزرسانی آیتم موجود در سبد
  const updateCartItem = (index, newItem) => {
    const newCart = cart.map((item, i) => (i === index ? newItem : item));
    setCart(newCart);
    saveCart(newCart);
  };

  // پاک کردن کل سبد
  const clearCart = () => {
    setCart([]);
    AsyncStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      setCart,
      addToCart, 
      removeFromCart, 
      updateCartItem, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};