import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export type CatalogItemOption = {
  id: number;
  name: string;
  price: number;
  category: string;
};

export type CatalogItem = {
  id: number;
  name: string;
  price: number;
  imageUri: string;
  options: CatalogItemOption[];
};

export async function GET(req: Readonly<Request>) {
  const language = req.headers.get('accept-language')?.split(',')[0] || 'en';

  // 메뉴 데이터 가져오기
  const items = db.prepare(`
    SELECT 
      items.id,
      COALESCE(tmenu.translatedName, items.name) AS name,
      items.price,
      items.imageUri
    FROM items
    LEFT JOIN translations_menu tmenu
      ON tmenu.menuId = items.id AND tmenu.language = ?
  `).all([language]) as CatalogItem[];

  // 각 메뉴의 옵션 가져오기
  for (const item of items) {
    const options = db.prepare(`
      SELECT 
        options.id,
        COALESCE(topt.translatedName, options.name) AS name,
        options.price,
        options.category
      FROM options
      LEFT JOIN translations_options topt
        ON topt.optionId = options.id AND topt.language = ?
      WHERE options.itemId = ?
    `).all([language, item.id]) as CatalogItemOption[];

    item.options = options;
  }

  return NextResponse.json(items);
}