import { NextResponse } from 'next/server';

export type CatalogItemOption = {
  id: number;
  name: string;
  price: number;
};

export type CatalogItem = {
  imageUri: string;
  id: number;
  name: string;
  price: number;
  options: CatalogItemOption[]
};

export async function GET() {
  const items: CatalogItem[] = [
    { id: 1, name: 'Coffee', price: 3.5, imageUri: '/static/coffee.jpg', options: [
      { id: 1, name: 'Extra Shot', price: 0.75 },
      { id: 2, name: 'Double Shot', price: 1.5 },
      { id: 3, name: 'Decaf Shot', price: 0.75 },
      { id: 4, name: 'Classic Syrup', price: 0.5 },
      { id: 5, name: 'Vanilla Syrup', price: 0.75 },
      { id: 6, name: 'Caramel Syrup', price: 0.75 },
      { id: 7, name: 'Hazelnut Syrup', price: 0.75 },
      { id: 8, name: 'Sugar-free Syrup', price: 0.75 },
      { id: 9, name: 'Regular Milk', price: 0.5 },
      { id: 10, name: 'Skim Milk', price: 0.5 },
      { id: 11, name: 'Almond Milk', price: 0.75 },
      { id: 12, name: 'Oat Milk', price: 0.75 },
      { id: 13, name: 'Light Ice', price: 0 },
      { id: 14, name: 'Extra Ice', price: 0.25 },
      { id: 15, name: 'No Ice', price: 0 },
    ]},
    { id: 2, name: 'Sandwich', price: 5.0, imageUri: '/static/sandwich.jpg', options: [
      
    ]},
    { id: 3, name: 'Juice', price: 4.0, imageUri: '/static/juice.jpg', options: [

    ]},
  ];

  return NextResponse.json(items);
}