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
  const catalog = useCatalog();
  const cart = useCart();

  const handleAddToCart = (item: MenuItem) => {
    cart.addToCart({ ...item, quantity: 1 });
  };

  return (
    <div>
      <h2>Menu</h2>
      <ul>
        {catalog.map((item) => (
          <li key={item.id}>
            {item.name} - ${item.price}
            <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
          </li>
        ))}
      </ul>
      <ul>
        {cart.item.map(item => (
          <li key={item.id}>
            {item.quantity}x {item.name} - ${item.price * item.quantity}
            <button onClick={() => cart.removeFromCart(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: ${cart.total}</p>
      <button onClick={cart.clearCart}>Clear Cart</button>
      <Link href='/checkout'>Continue to Checkout</Link>
    </div>
  );
}