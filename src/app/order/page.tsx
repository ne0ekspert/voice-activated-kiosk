'use client';
import Link from 'next/link';
import { useCatalog } from '../context/catalogContext';
import { useCart } from '../context/cartContext';

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

export default function Menu() {
  const items = useCatalog();
  const { addToCart } = useCart();

  const handleAddToCart = (item: MenuItem) => {
    addToCart({ ...item, quantity: 1 });
  };

  return (
    <div>
      <h2>Menu</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} - ${item.price}
            <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
          </li>
        ))}
      </ul>
      <Link href='/checkout'>Continue to Checkout</Link>
    </div>
  );
}