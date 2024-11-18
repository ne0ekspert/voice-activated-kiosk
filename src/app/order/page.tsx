'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCatalog } from '../context/catalogContext';
import { useCart } from '../context/cartContext';

interface MenuItem {
  id: number;
  name: string;
  price: number;
};

export default function Menu() {
  const catalog = useCatalog();
  const cart = useCart();

  const handleAddToCart = (item: MenuItem) => {
    cart.addToCart({ ...item, quantity: 1 });
  };

  return (
    <div className='flex flex-col h-svh w-full'>
      <h1 className='text-3xl'>Menu</h1>
      <div className='flex h-max grow'>
        <div className='h-full w-0 grow p-2 border-r border-gray-500'>
          <ul>
            {catalog.map((item) => (
              <li key={item.id} className='flex items-center text-xl border-b border-gray-500' onClick={() => handleAddToCart(item)}>
                <Image src={item.imageUri} alt='Product' width='100' height='100' className='p-2' />
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
        </div>
        <div className='flex flex-col h-full w-0 grow p-2'>
          <ul className='grow'>
            {cart.item.map(item => (
              <li key={item.id}>
                {item.quantity}x {item.name} - ${item.price * item.quantity}
                <button onClick={() => cart.removeFromCart(item.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <p>Total: ${cart.total}</p>
          <button onClick={cart.clearCart}>Clear Cart</button>
        </div>
      </div>
      <Link href='/checkout' className='w-full'>Continue to Checkout</Link>
    </div>
  );
}