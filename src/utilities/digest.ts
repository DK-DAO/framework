import crypto from 'crypto';
import { keccak256 } from 'js-sha3';

export class Digest {
  public static buildDigest(): { s: Buffer; h: Buffer } {
    const buf = crypto.randomBytes(32);
    // Write time stamp to last 8 bytes it's implementation of S || t
    buf.writeBigInt64BE(BigInt(Date.now()), 24);
    return {
      s: buf,
      h: Buffer.from(keccak256.create().update(buf).digest()),
    };
  }

  public static buildDigestArray(size: number) {
    const h = [];
    const s = [];
    const buf = crypto.randomBytes(size * 32);
    for (let i = 0; i < size; i += 1) {
      const j = i * 32;
      buf.writeBigInt64BE(BigInt(Date.now()), j + 24);
      const t = Buffer.alloc(32);
      buf.copy(t, 0, j, j + 32);
      const d = Buffer.from(keccak256.create().update(t).digest());
      s.push(t);
      h.push(d);
      d.copy(buf, j);
    }
    return {
      h,
      s,
      v: buf,
    };
  }
}

export default Digest;
