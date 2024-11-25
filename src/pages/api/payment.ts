import type { NextApiRequest, NextApiResponse } from "next";
import pn532 from 'pn532';
import i2c from 'i2c';

export type PaymentInfo = {
    cardNumber: number;
}

const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
const rfid = new pn532.PN532(wire);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform'
    });

    // Set a timeout for the long-polling (e.g., 30 seconds)
    const timeout = setTimeout(() => {
        cleanup();
        res.write('event: msg\n');
        res.write('data: ');
        res.write(JSON.stringify({ content: 'No tag detected', status: 'timeout' }));
        res.write('\n\n');
        res.end();
    }, 30000);

    function cleanup() {
        rfid.removeAllListeners('tag');
        rfid.removeAllListeners('ready');
        clearTimeout(timeout);
    }

    rfid.on('ready', () => {
        console.log('Listening for a tag scan...');
        rfid.on('tag', (tag) => {
            cleanup();
            res.write('event: msg\n');
            if (tag) {
                console.log('Tag detected:', tag.uid);
                res.write(`data: ${JSON.stringify({ content: tag.uid, status: 'success' })}\n\n`);
            } else {

                res.write(`data: ${JSON.stringify({ content: 'Empty tag detected', status: 'error' })}\n\n`);
            }
            res.end();
        });
    });

    rfid.on('error', (err) => {
        cleanup();
        console.error('Error:', err);
        res.write('event: msg\n');
        res.write(`data: ${JSON.stringify({ content: 'NFC error', status: 'error' })}\n`);
        res.end();
    });
}