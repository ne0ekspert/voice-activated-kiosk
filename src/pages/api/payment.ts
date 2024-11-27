import type { NextApiRequest, NextApiResponse } from "next";

export type PaymentInfo = {
    cardNumber: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform'
    });

    // Set a timeout for the long-polling (e.g., 30 seconds)
    setTimeout(() => {
        res.write('event: msg\n');
        res.write('data: ');
        res.write(JSON.stringify({ content: 'No tag detected', status: 'timeout' }));
        res.write('\n\n');
    }, 30000);

    let success = false;
    while (!success) {
        const response = await fetch('http://127.0.0.1:5000/api/nfc');

        if (response.ok) {
            const data = await response.text();
            res.write('event: msg\n');
            res.write('data: ')
            res.write(JSON.stringify({ content: data, status: 'success'}));
            res.write('\n\n');
            success = true
        }
    }
}