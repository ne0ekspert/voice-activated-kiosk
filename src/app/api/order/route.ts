import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  console.log('Order received:', body);

  const response = await fetch(process.env.CHECKOUT_WEBHOOK_URL || '', {
    method: 'POST',
    body: JSON.stringify({
      content: body
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) console.error('Webhook failed!');

  return NextResponse.json({ message: 'Order submitted successfully!' });
}