'use client';

import { useCart } from "../context/cartContext";

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface MenuListProps {
  items: MenuItem[];
}

export default function MenuList({ items }: MenuListProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (item: MenuItem) => {
    addToCart({ ...item, quantity: 1 });
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name} - ${item.price}
          <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
        </li>
      ))}
    </ul>
  );
}