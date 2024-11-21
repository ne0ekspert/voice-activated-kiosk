'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/cartContext';
import { CartItemComponent } from '../order/page';

export default function Checkout() {
  const cart = useCart();

  async function handleCheckout() {
    const response = await fetch('/api/order', {
      method: 'POST',
      body: JSON.stringify({ items: cart.item }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    console.log(data);
  }

  return (
    <div>
      <h1 className='text-3xl'>Checkout</h1>
      <div className='overflow-y-auto'>
        {cart.item.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul>
            {cart.item.map((item) => (
              <CartItemComponent item={item} key={item.id} />
            ))}
          </ul>
        )}
        <p>Total: ${cart.total}</p>
        <button onClick={cart.clearCart}>Clear Cart</button>
        <button>Proceed to Payment</button>
      </div>
      <div>
        <fieldset>
          <legend>Takeout</legend>
          <label htmlFor='takeout_no'>Eat here</label>
          <label htmlFor='takeout_yes'>Takeout</label>
          <input type='radio' name='takeout' value='0' id='takeout_no' />
          <input type='radio' name='takeout' value='1' id='takeout_yes' />
        </fieldset>
        <fieldset>
          <legend>Payment</legend>
          <label htmlFor='payment_card'>Card</label>
          <label htmlFor='payment_cash'>Cash</label>
          <input type='radio' name='payment' value='card' id='payment_card' />
          <input type='radio' name='payment' value='cash' id='payment_cash' />
        </fieldset>
      </div>
      <div className='flex'>
        <button onClick={handleCheckout} className='action-button'>Submit Order</button>
        <Link href='/order' className='cancel-button'>Back to Order</Link>
      </div>
    </div>
  );
}