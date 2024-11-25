'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CatalogItemOption } from '@/pages/api/items'
import { useLanguage } from './languageContext';
import { useCatalog } from './catalogContext';

export type CartItemOption = CatalogItemOption & {
  quantity: number
};

export type CartItem = {
  id: string;
  name: string;
  catalogid: number;
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
  removeOptionFromItem: (item: CartItem, option: CartItemOption) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const catalog = useCatalog();
  const language = useLanguage();

  useEffect(() => {
    setCart((prevCart) =>
      prevCart.map((cartItem) => {
        // Find the corresponding catalog item in the current language
        const catalogItem = catalog.find((item) => item.id === cartItem.catalogid);

        if (!catalogItem) return cartItem; // If the item is not found, keep it as is

        return {
          ...cartItem,
          name: catalogItem.name, // Update item name based on the catalog
          options: cartItem.options.map((cartOption) => {
            // Find the corresponding catalog option
            const catalogOption = catalogItem.options.find((opt) => opt.id === cartOption.id);
            return catalogOption
              ? {
                  ...cartOption,
                  name: catalogOption.name, // Update option name
                  category: catalogOption.category,
                }
              : cartOption; // If the option is not found, keep it as is
          }),
        };
      })
    );
  }, [catalog, language.language]);

  useEffect(() => {
    const updatedCart = cart.map((cartItem) => {
      const optionsSubtotal = cartItem.options.reduce(
        (acc, option) => acc + option.quantity * option.price,
        0
      );

      return {
        ...cartItem,
        subtotal: (cartItem.price + optionsSubtotal) * cartItem.quantity,
      };
    });

    // Perform shallow comparison instead of JSON.stringify
    const isCartDifferent = updatedCart.some((item, index) => {
      const currentItem = cart[index];
      return (
        item.subtotal !== currentItem.subtotal || 
        item.quantity !== currentItem.quantity
      );
    });

    if (isCartDifferent) {
      setCart(updatedCart);
    }
  }, [cart]);

  const addItemToCart = (item: CartItem) => {
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

  const removeOptionFromItem = (item: CartItem, option: CartItemOption) => {
    setCart((prevCart) => {
      const updatedOptions = prevCart.map(cartItem => 
        cartItem.id === item.id ? 
            { ...cartItem, options: cartItem.options.filter(prevOption => prevOption.id !== option.id) }
          : 
            cartItem
      );

      return updatedOptions;
    });
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + (item.subtotal ?? 0), 0);

  return (
    <CartContext.Provider value={{ item: cart, addItemToCart, addOptionToItem, changeItemQuantity, removeItemFromCart, removeOptionFromItem, clearCart, total }}>
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
