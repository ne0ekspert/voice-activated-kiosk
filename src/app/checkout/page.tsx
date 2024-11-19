'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/cartContext';

export default function Checkout() {
  const [orderStatus, setOrderStatus] = useState('');
  const cart = useCart();

  const handleCheckout = async () => {
    const response = await fetch('/api/order', {
      method: 'POST',
      body: JSON.stringify({ items: cart.item }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    
    setOrderStatus(data.message);
  };

  return (
    <div>
      <h2>Checkout</h2>
      {cart.item.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul>
            {cart.item.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity} - ${item.price * item.quantity}
                <button onClick={() => cart.removeItemFromCart(item)}>Remove</button>
              </li>
            ))}
          </ul>
          <p>Total: ${cart.total}</p>
          <button onClick={cart.clearCart}>Clear Cart</button>
          <button>Proceed to Payment</button>
        </div>
      )}
      <button onClick={handleCheckout}>Submit Order</button>
      {orderStatus && <p>{orderStatus}</p>}
      <Link href='/order'>Back to Order</Link>
    </div>
  );
}