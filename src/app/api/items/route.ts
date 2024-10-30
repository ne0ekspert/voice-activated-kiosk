import { NextResponse } from 'next/server';

export async function GET() {
  const items = [
    { id: 1, name: 'Coffee', price: 3.5 },
    { id: 2, name: 'Sandwich', price: 5.0 },
    { id: 3, name: 'Juice', price: 4.0 },
  ];
  return NextResponse.json(items);
}