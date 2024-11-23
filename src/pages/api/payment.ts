import EventEmitter from 'events';
import type { NextApiRequest, NextApiResponse } from "next";
import pn532 from 'pn532';
//import i2c from 'i2c';

export type PaymentInfo = {
    cardNumber: number;
}

//const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
class NFC extends EventEmitter {
    constructor() {
        super();

        this.emit('ready')

        this.on('newListener', (event: string) => {
            this.emit('tag', { uid: 1234 });
        });
    }
}
const rfid = new NFC();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
    });
    res.write('event: msg\n');
    res.write('data: test\n\n')

    // Set a timeout for the long-polling (e.g., 30 seconds)
    const timeout = setTimeout(() => {
        cleanup();
        JSON.stringify({ message: 'No tag detected', status: 'timeout' });
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
            if (tag) {
                console.log('Tag detected:', tag.uid);
                JSON.stringify({ cardNumber: tag.uid, status: 'success' });
            } else {
                JSON.stringify({ message: 'Empty tag detected', status: 'error' });
            }
        });
    });

    rfid.on('error', (err) => {
        cleanup();
        console.error('Error:', err);
        JSON.stringify({ message: 'NFC error', status: 'error' });
    });
}