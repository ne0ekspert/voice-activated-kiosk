import { EventEmitter } from "stream";

declare module 'pn532' {
    class PN532 extends EventEmitter {
        constructor(hal: { name: string }, options?: object);
        sendCommand(commandBuffer: Array<number>);
        configureSecureAccessModule();
        getFirmwareVersion();
        getGeneralStatus();
        scanTag();
        readBlock(options?: object);
        readNdefData();
        writeBlock(block, options?: object);
        writeNdefData(data);
        authenticateBlock(uid, options?: object);
    }
};
