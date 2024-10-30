import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  console.log('Order received:', body);

  // Handle order submission logic here, like saving to a database
  return NextResponse.json({ message: 'Order submitted successfully!' });
}