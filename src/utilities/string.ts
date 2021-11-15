import crypto from 'crypto';

export class String {
  public static randomBytesHexString(size: number = 32): string {
    return `0x${crypto.randomBytes(size).toString('hex')}`;
  }

  public static randomUint256() {
    return String.randomBytesHexString();
  }

  public static randomUint128() {
    return String.randomBytesHexString(16);
  }

  public static stringToBytes32(v: string): string {
    const buf = Buffer.alloc(32);
    buf.write(v);
    return `0x${buf.toString('hex')}`;
  }
}

export default String;
