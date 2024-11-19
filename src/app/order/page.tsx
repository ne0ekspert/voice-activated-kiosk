'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCatalog } from '../context/catalogContext';
import { useCart } from '../context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import type { ChangeEvent } from 'react';
import type { CartItem } from '../context/cartContext';

interface MenuItem {
  id: number;
  name: string;
  price: number;
};

export function CartItemComponent({ item }: { item: CartItem }) {
  const catalog = useCatalog();
  const cart = useCart();

  const addOption = (e: ChangeEvent<HTMLSelectElement>, itemId: string) => {
    e.preventDefault();
    
    const optionId = e.target.selectedIndex - 1;
    const item = cart.item.find((cartItem) => cartItem.id === itemId)!;
    const catalogOption = catalog.find((catalogItem) => catalogItem.id === item.catalogid)!.options[optionId];
    const option = {...catalogOption, quantity: 1};
    cart.addOptionToItem(item, option);
    console.log(cart.item);
  };

  return (
    <li key={item.id} className='border-b border-gray-400 pb-2 pt-2'>
      {item.quantity}x {item.name} - ${item.price * item.quantity}
      <ul>
        {item.options.map((option) => (
          <li key={option.id}>+ {option.name} - ${option.price}</li>
        ))}
      </ul>
      <select className='bg-black' defaultValue='' onChange={(e) => addOption(e, item.id)}>
        <option value='' disabled>Select Add-on</option>
        {[...new Map(
          catalog
            .find((menu) => menu.id === item.catalogid)?.options
            ?.map((option) => [option.category, option]) // Deduplicate by category
        ).values()]
        .map((optionGroup) => (
          <optgroup key={optionGroup.category} label={optionGroup.category}>
            {catalog.find((menu) => menu.id === item.catalogid)?.options
              .filter((option) => option.category === optionGroup.category)
              .map((options) => (
                <option key={options.id} value={options.id}>{options.name} - ${options.price}</option>
              ))}
          </optgroup>
        ))}
      </select>
      <p>Subtotal: ${item.subtotal ?? 0}</p>
      <button onClick={() => cart.removeItemFromCart(item)}>Remove</button>
    </li>
  );
}

export default function Menu() {
  const catalog = useCatalog();
  const cart = useCart();

  const handleAddToCart = (item: MenuItem) => {
    cart.addItemToCart({ ...item, catalogid: item.id, id: uuidv4(), quantity: 1, options: [] });
  };

  return (
    <div className='flex flex-col h-svh w-full p-3'>
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
              <CartItemComponent item={item} key={item.id} />
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