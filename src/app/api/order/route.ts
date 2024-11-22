import { CartItem } from '@/app/context/cartContext';
import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export type CheckoutJson = {
  items: CartItem[];
  payment: string;
  takeout: boolean;
};

export async function POST(request: Request) {
  const body: CheckoutJson = await request.json();

  let result = 'Order received:\n';
  let total = 0;
  for (const item of body.items) {
    const catalogItem = db.prepare(`
      SELECT
        name, price
      FROM
        items
      WHERE
        id = ?
    `).get([item.catalogid]) as { name: string; price: number; };

    result += `${item.quantity}x ${catalogItem.name} - $${catalogItem.price * item.quantity}\n`;
    for (const option of item.options) {
      const catalogOption = db.prepare(`
        SELECT
          name, price
        FROM
          options
        WHERE
          id = ?
      `).get([option.id]) as { name: string; price: number; };
      result += `+ ${option.quantity}x ${catalogOption.name} - $${catalogOption.price * option.quantity}\n`;
    }
    result += '\n';
    total += catalogItem.price * item.quantity;
  }
  result += `Total: $${total}\n`;
  result += `Payment using ${body.payment}, `
  if (body.takeout) result += 'taking out.';
  else result += 'eating here.'

  console.log(result);
/*
  const response = await fetch(process.env.CHECKOUT_WEBHOOK_URL || '', {
    method: 'POST',
    body: JSON.stringify({
      content: result
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) console.error('Webhook failed!', response);
*/
  return NextResponse.json({ message: 'Order submitted successfully!' });
}