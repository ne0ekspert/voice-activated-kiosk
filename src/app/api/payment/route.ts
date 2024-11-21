import { NextResponse } from 'next/server';
import pn532 from 'pn532';
import i2c from 'i2c';

export type PaymentInfo = {
    cardNumber: number;
}

const wire = new i2c(pn532.I2C_ADDRESS, {device: '/dev/i2c-1'});
const rfid = new pn532.PN532(wire);

export async function GET(req: Readonly<Request>) {
    return new Promise((resolve) => {
        // Set a timeout for the long-polling (e.g., 30 seconds)
        const timeout = setTimeout(() => {
            cleanup();
            resolve(NextResponse.json({ message: 'No tag detected', status: 'timeout' }));
        }, 30000);

        function cleanup() {
            rfid.removeAllListeners('tag');
            rfid.removeAllListeners('ready');
            clearTimeout(timeout);
        }

        rfid.on('ready', function () {
            console.log('Listening for a tag scan...');
            rfid.on('tag', function (tag) {
                cleanup();
                if (tag) {
                    console.log('Tag detected:', tag.uid);
                    resolve(NextResponse.json({ cardNumber: tag.uid, status: 'success' }));
                } else {
                    resolve(NextResponse.json({ message: 'Empty tag detected', status: 'error' }));
                }
            });
        });
    });
}