'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCatalog } from '../context/catalogContext';
import { useCart } from '../context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import { useRef, type ChangeEvent, type MouseEvent } from 'react';
import type { CartItem } from '../context/cartContext';
import { PageTitle } from '../components/title';
import { useLanguage } from '../context/languageContext';
import { BsXLg, BsCaretRightFill } from 'react-icons/bs';

interface MenuItem {
  id: number;
  name: string;
  price: number;
};

export function CartItemComponent({ item }: { item: CartItem }) {
  const optionSelectRef = useRef<HTMLSelectElement>();
  const catalog = useCatalog();
  const cart = useCart();
  const { t } = useLanguage();
  
  const catalogItem = catalog.find((catalogItem) => catalogItem.id === item.catalogid)!;
  
  const addOption = (e: ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    
    const optionId = parseInt(e.target.value);
    const catalogOption = catalogItem.options.find((option) => option.id === optionId)!;
    
    console.log(catalogOption);
    
    const option = {...catalogOption, quantity: 1};
    cart.addOptionToItem(item, option);

    optionSelectRef.current.value = '';
    
    console.log(cart.item);
  };

  const removeOption = (e: MouseEvent<HTMLButtonElement>, optionId: number) => {
    e.preventDefault();

    const option = item.options.find((option) => option.id === optionId)!;

    cart.removeOptionFromItem(item, option);
  };

  return (
    <li key={item.id} className='border-b border-gray-400 pb-2 pt-2'>
      <div className='flex'>
        <div>
          <Image src={catalogItem.imageUri} alt={item.name} width='100' height='100' className='aspect-square p-2' />
        </div>
        <div className='w-full'>
          <span className='text-2xl'>{item.quantity}x {item.name} - ${item.price * item.quantity}</span>
          <ul>
            {item.options.map((option) => (
              <li key={option.id} className='flex items-center w-full pt-2 pb-2'>
                + {option.name} - ${option.price}
                <hr className='grow border border-gray-500 m-4'/>
                <button onClick={(e) => removeOption(e, option.id)}
                        className='light-remove-button rounded-full pl-3 pr-3 pt-1 pb-1'>
                  {t('cart.remove_option')}
                </button>
              </li>
            ))}
          </ul>
          <select ref={optionSelectRef} className='bg-transparent' defaultValue='' onChange={(e) => addOption(e)}>
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
        </div>
      </div>
      <div className='flex justify-between items-center'>
        <span className='text-2xl pl-3'>{t('item.subtotal')}: ${item.subtotal ?? 0}</span>
        <button onClick={() => cart.removeItemFromCart(item)}
                className='remove-button rounded-full pl-5 pr-5 pt-2 pb-2'>{t('cart.remove')}</button>
      </div>
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
        <div className='w-1/2 p-2 border-r border-gray-500 overflow-y-auto max-h-85vh'>
          <ul>
            {catalog.map((item) => (
              <li key={item.id} className='flex items-center text-xl border-b border-gray-500' onClick={() => handleAddToCart(item)}>
                <Image src={item.imageUri} alt={item.name} width='100' height='100' className='p-2' />
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
        </div>

        <div className='flex flex-col w-1/2 p-2 max-h-85vh'>
          <ul className='grow overflow-y-auto'>
            {cart.item.map(item => (
              <CartItemComponent item={item} key={item.id} />
            ))}
          </ul>
          <div>
            <div className='text-3xl font-bold m-5'>{t('cart.total')}: ${cart.total}</div>
            <div className='flex justify-evenly w-full'>
              <button onClick={cart.clearCart} className='flex items-center justify-center cancel-button h-16 w-80 rounded-full text-2xl'>
                <BsXLg className='mr-5' />{t('cart.clear')}
              </button>
              <Link href='/checkout'>
                <button className='flex items-center justify-center action-button h-16 w-80 rounded-full text-2xl'>
                  {t('menu.to_checkout')}<BsCaretRightFill className='ml-5' />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}