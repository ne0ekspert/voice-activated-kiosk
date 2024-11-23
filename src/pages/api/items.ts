import { db } from '@/app/lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']); // Specify allowed methods
    res.status(405).json({ error: 'Method not allowed' });
  }

  const language = req.headers['accept-language']?.split(',')[0] || 'en';

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

  res.json(items);
}