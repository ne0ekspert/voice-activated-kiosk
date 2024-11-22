'use client';
import Link from 'next/link';
import {
  BsCreditCard,
  BsCashCoin,
  BsPinMap,
  BsReply,
  BsCaretLeftFill,
  BsCaretRightFill
} from "react-icons/bs";
import { useLanguage } from '../context/languageContext';
import { useCart } from '../context/cartContext';
import { CartItemComponent } from '../order/page';
import { PageTitle } from '../components/title';

import type { FormEvent, FormEventHandler } from 'react';
import { CheckoutJson } from '../api/order/route';

export default function Checkout() {
  const cart = useCart();
  const { t } = useLanguage();

  async function checkoutSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const payload: CheckoutJson = {
      items: cart.item,
      payment: e.target.elements.payment.value,
      takeout: e.target.elements.takeout.value === '1'
    };
    console.log(e.target);
    const response = await fetch('/api/order', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    console.log(data);
  }

  return (
    <div>
      <PageTitle>Checkout</PageTitle>
      <div className='flex'>
        <div className='flex flex-col w-1/2 grow overflow-y-auto max-h-85vh'>
          <div className='grow'>
            {cart.item.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <ul className='h-full'>
                {cart.item.map((item) => (
                  <CartItemComponent item={item} key={item.id} />
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className='text-3xl font-bold m-5'>{t('cart.total')}: ${cart.total}</p>
          </div>
        </div>
        <form className='w-1/2' onSubmit={checkoutSubmit}>
          <fieldset className='flex justify-evenly border-t border-gray-600 pt-8 pb-8'>
            <legend className='text-4xl pl-10 pr-3'>{t('checkout.takeout.title')}</legend>
            <input type='radio' name='takeout' value='0' id='takeout_no' className='hidden'/>
            <label htmlFor='takeout_no'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsPinMap size={80} />
                <span className='text-2xl'>{t('checkout.takeout.inside')}</span>
              </div>
            </label>
            <input type='radio' name='takeout' value='1' id='takeout_yes' className='hidden' />
            <label htmlFor='takeout_yes'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsReply size={80} />
                <span className='text-2xl'>{t('checkout.takeout.outside')}</span>
              </div>
            </label>
          </fieldset>
          <fieldset className='flex justify-evenly border-t border-gray-600 pt-8 pb-8'>
            <legend className='text-4xl pl-10 pr-3'>{t('checkout.payment.title')}</legend>
            <input type='radio' name='payment' value='card' id='payment_card' className='hidden' />
            <label htmlFor='payment_card'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsCreditCard size={80} />
                <span className='text-2xl'>{t('checkout.payment.card')}</span>
              </div>
            </label>
            <input type='radio' name='payment' value='cash' id='payment_cash' className='hidden'/>
            <label htmlFor='payment_cash'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsCashCoin size={80} />
                <span className='text-2xl'>{t('checkout.payment.cash')}</span>
              </div>
            </label>
          </fieldset>
          <div className='flex justify-evenly w-full'>
            <Link href='/order'>
              <button className='flex items-center justify-center cancel-button h-16 w-80 rounded-full text-2xl'>
                <BsCaretLeftFill className='mr-5'/>Back to Order
              </button>
            </Link>
            <button className='flex items-center justify-center action-button h-16 w-80 rounded-full text-2xl'>
              Submit Order<BsCaretRightFill className='ml-5'/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}