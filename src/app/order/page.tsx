'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCatalog } from '../context/catalogContext';
import { useCart } from '../context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import type { ChangeEvent, MouseEvent } from 'react';
import type { CartItem } from '../context/cartContext';
import { PageTitle } from '../components/title';
import { useLanguage } from '../context/languageContext';

interface MenuItem {
  id: number;
  name: string;
  price: number;
};

export function CartItemComponent({ item }: { item: CartItem }) {
  const catalog = useCatalog();
  const cart = useCart();
  const { t } = useLanguage();

  const addOption = (e: ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    
    const optionId = parseInt(e.target.value);
    const catalogItem = catalog.find((catalogItem) => catalogItem.id === item.catalogid)!;
    const catalogOption = catalogItem.options.find((option) => option.id === optionId)!;
    
    console.log(catalogOption);
    
    const option = {...catalogOption, quantity: 1};
    cart.addOptionToItem(item, option);
    
    console.log(cart.item);
  };

  const removeOption = (e: MouseEvent<HTMLButtonElement>, optionId: number) => {
    e.preventDefault();

    const option = item.options.find((option) => option.id === optionId)!;

    cart.removeOptionFromItem(item, option);
  };

  return (
    <li key={item.id} className='border-b border-gray-400 pb-2 pt-2'>
      {item.quantity}x {item.name} - ${item.price * item.quantity}
      <ul>
        {item.options.map((option) => (
          <li key={option.id}>+ {option.name} - ${option.price} <button onClick={(e) => removeOption(e, option.id)}>Remove</button></li>
        ))}
      </ul>
      <select className='bg-transparent' defaultValue='' onChange={(e) => addOption(e)}>
        <option value='' disabled>{t('item.select_addon')}</option>
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
      <p>{t('item.subtotal')}: ${item.subtotal ?? 0}</p>
      <button onClick={() => cart.removeItemFromCart(item)}>{t('cart.remove')}</button>
    </li>
  );
}

export default function Menu() {
  const catalog = useCatalog();
  const cart = useCart();
  const { t } = useLanguage();

  const handleAddToCart = (item: MenuItem) => {
    cart.addItemToCart({ ...item, catalogid: item.id, id: uuidv4(), quantity: 1, options: [] });
  };

  return (
    <div className='flex flex-col h-screen w-full'>
      <PageTitle>{t('menu.title')}</PageTitle>

      <div className='flex grow'>
        <div className='flex-none w-1/2 p-2 border-r border-gray-500 overflow-y-auto max-h-85vh'>
          <ul>
            {catalog.map((item) => (
              <li key={item.id} className='flex items-center text-xl border-b border-gray-500' onClick={() => handleAddToCart(item)}>
                <Image src={item.imageUri} alt='Product' width='100' height='100' className='p-2' />
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
        </div>

        <div className='flex flex-col w-1/2 p-2 max-h-85vh'>
          <ul className='flex-grow overflow-y-auto'>
            {cart.item.map(item => (
              <CartItemComponent item={item} key={item.id} />
            ))}
          </ul>
          <div>
            <p>{t('cart.total')}: ${cart.total}</p>
            <button onClick={cart.clearCart}>{t('cart.clear')}</button>
            <Link href='/checkout' className='w-full'>{t('menu.to_checkout')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}