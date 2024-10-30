import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h2>Welcome to the Kiosk</h2>
      <Link href="/order">Go to Menu</Link>
      <Link href="/checkout">Go to Checkout</Link>
    </div>
  );
}
