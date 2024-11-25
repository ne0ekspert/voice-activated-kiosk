
declare module "i2c" {
  import { EventEmitter } from "stream";
  interface I2COptions {
    debug?: boolean;
    device?: string;
  }

/*
  interface I2CStreamData {
    address: number;
    data: Buffer;
    cmd: number;
    length: number;
    timestamp: number;
  }
*/

  type Callback<T = void> = (err: Error | null, result?: T) => void;

  class I2C extends EventEmitter {
    constructor(address: number, options?: I2COptions);

    /** Address of the I2C device */
    address: number;

    /** History of received data */
    history: Buffer[];

    /**
     * Scans the I2C bus for available devices.
     * @param callback - Callback function to handle results.
     */
    scan(callback: Callback<number[]>): void;

    /**
     * Sets the address of the I2C device.
     * @param address - Address to set.
     */
    setAddress(address: number): void;

    /**
     * Opens a connection to the I2C bus.
     * @param device - Path to the I2C device.
     * @param callback - Callback function for completion.
     */
    open(device: string, callback: Callback): void;

    /**
     * Closes the I2C connection.
     */
    close(): void;

    /**
     * Writes data to the I2C device.
     * @param buf - Data to write.
     * @param callback - Callback function for completion.
     */
    write(buf: Buffer | string, callback: Callback): void;

    /**
     * Writes a single byte to the I2C device.
     * @param byte - Byte to write.
     * @param callback - Callback function for completion.
     */
    writeByte(byte: number, callback: Callback): void;

    /**
     * Writes a series of bytes to the I2C device.
     * @param cmd - Command byte.
     * @param buf - Data buffer.
     * @param callback - Callback function for completion.
     */
    writeBytes(cmd: number, buf: Buffer | string, callback: Callback): void;

    /**
     * Reads data from the I2C device.
     * @param len - Number of bytes to read.
     * @param callback - Callback function to handle results.
     */
    read(len: number, callback: Callback<Buffer>): void;

    /**
     * Reads a single byte from the I2C device.
     * @param callback - Callback function to handle the byte.
     */
    readByte(callback: Callback<number>): void;

    /**
     * Reads multiple bytes from the I2C device.
     * @param cmd - Command byte.
     * @param len - Number of bytes to read.
     * @param callback - Callback function to handle results.
     */
    readBytes(cmd: number, len: number, callback: Callback<Buffer>): void;

    /**
     * Streams data from the I2C device.
     * @param cmd - Command byte.
     * @param len - Number of bytes to read per stream.
     * @param delay - Delay between stream reads in milliseconds.
     */
    stream(cmd: number, len: number, delay?: number): void;
  }

  export = I2C;
}
