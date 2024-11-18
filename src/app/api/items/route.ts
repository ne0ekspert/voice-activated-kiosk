import { NextResponse } from 'next/server';

export async function GET() {
  const items = [
    { id: 1, name: 'Coffee', price: 3.5, imageUri: '/static/coffee.jpg' },
    { id: 2, name: 'Sandwich', price: 5.0, imageUri: '/static/sandwich.jpg' },
    { id: 3, name: 'Juice', price: 4.0, imageUri: '/static/juice.jpg' },
  ];
  return NextResponse.json(items);
}