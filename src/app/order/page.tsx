import Link from 'next/link';
import MenuList from './MenuList';

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/items`, {
    cache: 'no-store', // Ensures data is fetched on each request for fresh data
  });
  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }
  return response.json();
}

export default async function Menu() {
  const items = await fetchMenuItems();

  return (
    <div>
      <h2>Menu</h2>
      <MenuList items={items} />
      <Link href='/checkout'>Continue to Checkout</Link>
    </div>
  );
}