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
        res.end();
    }, 30000);

    let response = await fetch('http://127.0.0.1:5000/api/nfc');
    do {
        if (response.ok) {
            res.write('event: msg\n');
            res.write('data: ')
            res.write(JSON.stringify({ content: await response.text(), status: 'success'}));
            res.write('\n\n');
            res.end();
            return;
        } else {
            response = await fetch('http://127.0.0.1:5000/api/nfc');
        }
    } while (response.ok);
}