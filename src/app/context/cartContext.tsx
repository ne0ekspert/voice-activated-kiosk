'use client';

import React, { createContext, useContext, useState } from 'react';
import type { CatalogItemOption } from '../api/items/route'

export type CartItemOption = CatalogItemOption & {
  quantity: number
};

export type CartItem = {
  id: string;
  catalogid: number;
  name: string;
  price: number;
  quantity: number;
  options: CartItemOption[]
  subtotal?: number;
};

type CartContextType = {
  item: CartItem[];
  addItemToCart: (item: CartItem) => void;
  addOptionToItem: (item: CartItem, option: CartItemOption) => void;
  changeItemQuantity: (item: CartItem, quantity: number) => void;
  removeItemFromCart: (item: CartItem) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItemToCart = (item: CartItem) => {
    item.subtotal = item.price * item.quantity;

    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prevCart, item];
    });
  };

  const addOptionToItem = (item: CartItem, option: CartItemOption) => {
    const newCart = cart.map((cartItem) => {
      if (cartItem === item) {
        // Filter out existing options with the same option.id
        const updatedOptions = [
          ...cartItem.options.filter((existingOption) => existingOption.id !== option.id),
          option, // Add the new option
        ];

        // Return the updated item with the new unique options list
        return {
          ...cartItem,
          options: updatedOptions,
          subtotal: cartItem.price * cartItem.quantity + updatedOptions.reduce((a, b) => a + b.price * b.quantity, 0)
        };
      }
      return cartItem;
    });

    setCart(newCart);
  };

  const changeItemQuantity = (item: CartItem, quantity: number) => {
    setCart((prevCart) =>
      prevCart
        .map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity } : cartItem)
        .filter((cartItem) => cartItem.quantity > 0) // Remove items with quantity <= 0
    );
  };

  const removeItemFromCart = (item: CartItem) => {
    setCart((prevCart) => prevCart.filter((cartItem) => cartItem !== item));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + (item.subtotal ?? 0), 0);

  return (
    <CartContext.Provider value={{ item: cart, addItemToCart, addOptionToItem, changeItemQuantity, removeItemFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
