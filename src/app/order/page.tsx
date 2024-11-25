'use client';
import Link from 'next/link';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { BsXLg, BsCaretRightFill } from 'react-icons/bs';

import { useCatalog } from '../context/catalogContext';
import { useCart } from '../context/cartContext';
import { useLanguage } from '../context/languageContext';

import { PageTitle } from '../components/title';
import { CartItemComponent } from '../components/cartItem';

type MenuItem = {
  id: number;
  name: string;
  price: number;
};

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
        <div className='w-1/2 p-2 border-r border-gray-500 overflow-y-auto max-h-80vh'>
          <ul>
            {catalog.map((item) => (
              <li key={item.id} className='flex items-center text-xl border-b border-gray-500' onClick={() => handleAddToCart(item)}>
                <Image src={item.imageUri} alt={item.name} width='100' height='100' className='p-2' />
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
        </div>

        <div className='flex flex-col w-1/2 p-2 max-h-80vh'>
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