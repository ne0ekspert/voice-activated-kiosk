'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BsCreditCard,
  BsCashCoin,
  BsPinMap,
  BsReply,
  BsCaretLeftFill,
  BsCaretRightFill
} from "react-icons/bs";
import { match } from 'ts-pattern';

import { useLanguage } from '../context/languageContext';
import { useCart } from '../context/cartContext';
import { CartItemComponent } from '../components/cartItem';
import { PageTitle } from '../components/title';
import { CheckoutJson } from '@/pages/api/order';

import type { MouseEvent, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';

function CashPaymentPopup({ takeout }: { takeout: boolean }) {
  const cart = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    const sendOrder = async () => {
      const payload: CheckoutJson = {
        items: cart.item,
        payment: 'cash',
        takeout
      }

      const response = await fetch('/api/order', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      console.log(data);
    };

    sendOrder();
  })
  return (
    <div className='absolute flex justify-center items-center top-0 w-screen h-screen bg-black bg-opacity-65'>
      <div className='w-2/3 h-2/3 bg-white rounded-2xl p-5'>
        <h1 className='text-3xl'>{t('payment.cash.title')}</h1>
      </div>
    </div>
  )
}
function CardPaymentPopup({ takeout }: { takeout: boolean }) {
  const [nfcStatus, setNfcStatus] = useState('');
  const cart = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    const sendOrder = async () => {
      const payload: CheckoutJson = {
        items: cart.item,
        payment: 'card',
        takeout
      };
      
      const response = await fetch('/api/order', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      console.log(data);
    };

    const eventSource = new EventSource('/api/payment');

    eventSource.addEventListener('msg', (e) => {
      const data: { content: string; status: string; } = JSON.parse(e.data);

      if (data.status === 'success') {
        sendOrder();
      }

      setNfcStatus(data.status);
    });

    return () => {
      eventSource.close();
    }
  }, [cart.item, takeout]);

  return (
    <div className='absolute flex justify-center items-center top-0 w-screen h-screen bg-black bg-opacity-65'>
      <div className='w-2/3 h-2/3 bg-white rounded-2xl p-5'>
        <h1 className='text-3xl'>{t('payment.card.title')}</h1>
        {match(nfcStatus)
          .with('success', () => (
            <div>
              <span>{t('payment.card.success')}</span>
            </div>
          ))
          .with('timeout', () => (
            <div>
              <span>{t('payment.card.timeout')}</span>
            </div>
          ))
          .with('error', () => (
            <div>
              <span>{t('payment.card.error')}</span>
            </div>
          ))
          .otherwise(() => (
            <div>
              <span>{t('payment.card.scan')}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default function Checkout() {
  const [takeout, setTakeout] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const cart = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const params: { method?: string } | null = useParams();

  function togglePaymentPopup(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setProcessingPayment(prev => !prev);
  }

  function takeoutChange(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    setTakeout(e.target.value === '1');
  }

  function paymentChange(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    router.replace(`?method=${e.target.value}`)
  }

  return (
    <div>
      <PageTitle>{t('checkout.title')}</PageTitle>
      <div className='flex'>
        <div className='flex flex-col w-1/2 grow overflow-y-auto max-h-80vh'>
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
        <div className='w-1/2'>
          <fieldset className='flex justify-evenly border-t border-gray-600 pt-8 pb-8' >
            <legend className='text-4xl pl-10 pr-3'>{t('checkout.takeout.title')}</legend>
            <input type='radio' name='takeout' value={0} id='takeout_no'
                   className='hidden' onChange={takeoutChange} />
            <label htmlFor='takeout_no'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsPinMap size={60} />
                <span className='text-2xl'>{t('checkout.takeout.inside')}</span>
              </div>
            </label>
            <input type='radio' name='takeout' value={1} id='takeout_yes'
                   className='hidden' onChange={takeoutChange} />
            <label htmlFor='takeout_yes'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsReply size={60} />
                <span className='text-2xl'>{t('checkout.takeout.outside')}</span>
              </div>
            </label>
          </fieldset>
          <fieldset className='flex justify-evenly border-t border-gray-600 pt-8 pb-8'>
            <legend className='text-4xl pl-10 pr-3'>{t('checkout.payment.title')}</legend>
            <input type='radio' name='payment' value='card' id='payment_card'
                   className='hidden' onChange={paymentChange} />
            <label htmlFor='payment_card'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsCreditCard size={60} />
                <span className='text-2xl'>{t('checkout.payment.card')}</span>
              </div>
            </label>
            <input type='radio' name='payment' value='cash' id='payment_cash'
                   className='hidden' onChange={paymentChange} />
            <label htmlFor='payment_cash'>
              <div className='flex flex-col justify-center items-center rounded-3xl'>
                <BsCashCoin size={60} />
                <span className='text-2xl'>{t('checkout.payment.cash')}</span>
              </div>
            </label>
          </fieldset>
          <div className='flex justify-evenly w-full'>
            <Link href='/order'>
              <button className='flex items-center justify-center cancel-button h-16 w-80 rounded-full text-2xl'>
                <BsCaretLeftFill className='mr-5'/>{t('checkout.button.to_order')}
              </button>
            </Link>
            <button onClick={togglePaymentPopup}
                    className='flex items-center justify-center action-button h-16 w-80 rounded-full text-2xl'>
              {t('checkout.button.submit')}<BsCaretRightFill className='ml-5'/>
            </button>
          </div>
        </div>
      </div>
      {match(params.method)
        .with('card', () => (
          <CardPaymentPopup takeout={takeout} />
        ))
        .with('cash', () => (
          <CashPaymentPopup takeout={takeout} />
        ))
        .otherwise(() => (
          <></>
        ))
      }
    </div>
  );
}