import Link from 'next/link';
import Image from 'next/image';

import './animation.css';
// start_screen/bur.jpg (이미지 위치)
// /public/static/start_screen/bur.jpg
export default function Home() {
  return (
    <div>
      <div className="hero">
        <Image src="/static/start_screen/bur.jpg" alt="Burrito Background" fill />
        <div className="hero-text">
          <h1 className="animated-text">Welcome to Sandstone Café</h1>
          <p>Order your favorite meal online and enjoy!</p>
          <Link href="/order">Start Order</Link>
        </div>
      </div>
    </div>
  );
}