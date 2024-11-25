import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }

    fetch(process.env.CHECKOUT_WEBHOOK_URL || '', {
        method: 'POST',
        body: JSON.stringify({
            content: "User called manager"
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    res.json({ message: 'success' });
}