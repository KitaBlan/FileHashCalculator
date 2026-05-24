/**
 * 计算引擎 / Hash Calculation Engine
 *
 * 混合策略：小文件走 Web Crypto，大文件走增量实现
 * Hybrid: small files -> Web Crypto, large files -> incremental
 *
 * @module core/engine
 */
import { Registry } from './algorithms/registry.ts';
import { getNobleAdapter } from './algorithms/noble.ts';
import { digest } from './algorithms/web-crypto.ts';
import { CRC32, CRC32C } from './algorithms/crc32.ts';
import { SettingsManager } from '../utils/storage.ts';

const hexTable = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
const hexTableUpper = hexTable.map((s) => s.toUpperCase());

function bufferToHex(buffer: Uint8Array, format: string): string {
  const table = format === 'uppercase' ? hexTableUpper : hexTable;
  let hex = '';
  for (let i = 0; i < buffer.length; i++) hex += table[buffer[i]];
  return hex;
}

export function getOptimalChunkInfo(fileSize: number, algoCount: number) {
  const mem = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  let size: number, label: string, detail: string;

  if (fileSize < 1024 * 1024) {
    size = 32768; label = '32 KB'; detail = '小文件，一次读取';
  } else if (fileSize < 10 * 1024 * 1024) {
    size = 65536; label = '64 KB'; detail = '较小文件，快速分块';
  } else if (fileSize < 100 * 1024 * 1024) {
    size = 262144; label = '256 KB'; detail = '中等文件（' + mem + 'GB 内存）';
  } else if (fileSize < 1024 * 1024 * 1024) {
    size = mem >= 8 ? 1048576 : 524288;
    label = size >= 1048576 ? '1 MB' : '512 KB';
    detail = '大文件（' + mem + 'GB 内存，' + cores + ' 核）';
  } else {
    size = mem >= 16 ? 4194304 : mem >= 8 ? 2097152 : 1048576;
    label = size >= 4194304 ? '4 MB' : size >= 2097152 ? '2 MB' : '1 MB';
    detail = '超大文件（' + mem + 'GB 内存，大分块减少 I/O）';
  }
  if (algoCount >= 8) {
    detail += '，多算法并行';
    size = Math.max(size, 262144);
  }

  return { size, label, detail, deviceMem: mem, deviceCores: cores };
}

// ========== MD5 ==========
const MD5_T = new Uint32Array([
  0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
  0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
  0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
  0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
  0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
  0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
  0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
  0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
]);

function md5Transform(s: Uint32Array, b: Uint8Array) {
  const x = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    x[i] = b[i * 4] | (b[i * 4 + 1] << 8) | (b[i * 4 + 2] << 16) | (b[i * 4 + 3] << 24);
  }
  let a = s[0], bv = s[1], c = s[2], d = s[3];

  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a += ((b & c) | (~b & d)) + x + t; return ((a << s) | (a >>> (32 - s))) + b;
  };
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a += ((b & d) | (c & ~d)) + x + t; return ((a << s) | (a >>> (32 - s))) + b;
  };
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a += (b ^ c ^ d) + x + t; return ((a << s) | (a >>> (32 - s))) + b;
  };
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    a += (c ^ (b | ~d)) + x + t; return ((a << s) | (a >>> (32 - s))) + b;
  };

  // Round 1
  a = ff(a, bv, c, d, x[0],  7, MD5_T[0]);  d = ff(d, a, bv, c, x[1],  12, MD5_T[1]);
  c = ff(c, d, a, bv, x[2],  17, MD5_T[2]);  bv = ff(bv, c, d, a, x[3],  22, MD5_T[3]);
  a = ff(a, bv, c, d, x[4],  7, MD5_T[4]);  d = ff(d, a, bv, c, x[5],  12, MD5_T[5]);
  c = ff(c, d, a, bv, x[6],  17, MD5_T[6]);  bv = ff(bv, c, d, a, x[7],  22, MD5_T[7]);
  a = ff(a, bv, c, d, x[8],  7, MD5_T[8]);  d = ff(d, a, bv, c, x[9],  12, MD5_T[9]);
  c = ff(c, d, a, bv, x[10], 17, MD5_T[10]); bv = ff(bv, c, d, a, x[11], 22, MD5_T[11]);
  a = ff(a, bv, c, d, x[12], 7, MD5_T[12]); d = ff(d, a, bv, c, x[13], 12, MD5_T[13]);
  c = ff(c, d, a, bv, x[14], 17, MD5_T[14]); bv = ff(bv, c, d, a, x[15], 22, MD5_T[15]);

  // Round 2
  a = gg(a, bv, c, d, x[1],  5, MD5_T[16]); d = gg(d, a, bv, c, x[6],  9, MD5_T[17]);
  c = gg(c, d, a, bv, x[11], 14, MD5_T[18]); bv = gg(bv, c, d, a, x[0],  20, MD5_T[19]);
  a = gg(a, bv, c, d, x[5],  5, MD5_T[20]); d = gg(d, a, bv, c, x[10], 9, MD5_T[21]);
  c = gg(c, d, a, bv, x[15], 14, MD5_T[22]); bv = gg(bv, c, d, a, x[4],  20, MD5_T[23]);
  a = gg(a, bv, c, d, x[9],  5, MD5_T[24]); d = gg(d, a, bv, c, x[14], 9, MD5_T[25]);
  c = gg(c, d, a, bv, x[3],  14, MD5_T[26]); bv = gg(bv, c, d, a, x[8],  20, MD5_T[27]);
  a = gg(a, bv, c, d, x[13], 5, MD5_T[28]); d = gg(d, a, bv, c, x[2],  9, MD5_T[29]);
  c = gg(c, d, a, bv, x[7],  14, MD5_T[30]); bv = gg(bv, c, d, a, x[12], 20, MD5_T[31]);

  // Round 3
  a = hh(a, bv, c, d, x[5],  4, MD5_T[32]); d = hh(d, a, bv, c, x[8],  11, MD5_T[33]);
  c = hh(c, d, a, bv, x[11], 16, MD5_T[34]); bv = hh(bv, c, d, a, x[14], 23, MD5_T[35]);
  a = hh(a, bv, c, d, x[1],  4, MD5_T[36]); d = hh(d, a, bv, c, x[4],  11, MD5_T[37]);
  c = hh(c, d, a, bv, x[7],  16, MD5_T[38]); bv = hh(bv, c, d, a, x[10], 23, MD5_T[39]);
  a = hh(a, bv, c, d, x[13], 4, MD5_T[40]); d = hh(d, a, bv, c, x[0],  11, MD5_T[41]);
  c = hh(c, d, a, bv, x[3],  16, MD5_T[42]); bv = hh(bv, c, d, a, x[6],  23, MD5_T[43]);
  a = hh(a, bv, c, d, x[9],  4, MD5_T[44]); d = hh(d, a, bv, c, x[12], 11, MD5_T[45]);
  c = hh(c, d, a, bv, x[15], 16, MD5_T[46]); bv = hh(bv, c, d, a, x[2],  23, MD5_T[47]);

  // Round 4
  a = ii(a, bv, c, d, x[0],  6, MD5_T[48]); d = ii(d, a, bv, c, x[7],  10, MD5_T[49]);
  c = ii(c, d, a, bv, x[14], 15, MD5_T[50]); bv = ii(bv, c, d, a, x[5],  21, MD5_T[51]);
  a = ii(a, bv, c, d, x[12], 6, MD5_T[52]); d = ii(d, a, bv, c, x[3],  10, MD5_T[53]);
  c = ii(c, d, a, bv, x[10], 15, MD5_T[54]); bv = ii(bv, c, d, a, x[1],  21, MD5_T[55]);
  a = ii(a, bv, c, d, x[8],  6, MD5_T[56]); d = ii(d, a, bv, c, x[15], 10, MD5_T[57]);
  c = ii(c, d, a, bv, x[6],  15, MD5_T[58]); bv = ii(bv, c, d, a, x[13], 21, MD5_T[59]);
  a = ii(a, bv, c, d, x[4],  6, MD5_T[60]); d = ii(d, a, bv, c, x[11], 10, MD5_T[61]);
  c = ii(c, d, a, bv, x[2],  15, MD5_T[62]); bv = ii(bv, c, d, a, x[9],  21, MD5_T[63]);

  s[0] = (s[0] + a)  | 0;
  s[1] = (s[1] + bv) | 0;
  s[2] = (s[2] + c)  | 0;
  s[3] = (s[3] + d)  | 0;
}
const MD5_IMPL = {
  init: () => ({ s: new Uint32Array([0x67452301,0xefcdab89,0x98badcfe,0x10325476]), count: 0, buffer: new Uint8Array(64), bufferIdx: 0 }),
  update: (state: any, data: Uint8Array) => {
    let offset = 0;
    if (state.bufferIdx > 0) {
      const needed = Math.min(data.length, 64 - state.bufferIdx);
      state.buffer.set(data.subarray(0, needed), state.bufferIdx);
      state.bufferIdx += needed; offset = needed;
      if (state.bufferIdx === 64) { md5Transform(state.s, state.buffer); state.bufferIdx = 0; }
    }
    while (offset + 64 <= data.length) { md5Transform(state.s, data.subarray(offset, offset+64)); offset += 64; }
    if (offset < data.length) { state.buffer.set(data.subarray(offset), 0); state.bufferIdx = data.length - offset; }
    state.count += data.length << 3;
  },
  final: (state: any) => {
    const buf = state.buffer; let idx = state.bufferIdx;
    buf[idx++] = 0x80;
    if (idx > 56) { while(idx<64) buf[idx++]=0; md5Transform(state.s, buf); idx=0; }
    while(idx<56) buf[idx++]=0;
    const view = new DataView(buf.buffer, 56, 8);
    view.setUint32(0, state.count & 0xffffffff, true);
    view.setUint32(4, Math.floor(state.count / 0x100000000) & 0xffffffff, true);
    md5Transform(state.s, buf);
    const result = new Uint8Array(16);
    for (let i=0;i<4;i++) { result[i*4]=state.s[i]&0xff; result[i*4+1]=(state.s[i]>>8)&0xff; result[i*4+2]=(state.s[i]>>16)&0xff; result[i*4+3]=(state.s[i]>>24)&0xff; }
    return result;
  },
};

// ========== SM3 ==========
const SM3_IV = [0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e];
function rotl32(x: number, n: number) { return ((x<<n)|(x>>>(32-n)))>>>0; }
function sm3Compress(s: Uint32Array, block: Uint8Array) {
  const W = new Uint32Array(68);
  for(let i=0;i<16;i++) W[i]=(block[i*4]<<24)|(block[i*4+1]<<16)|(block[i*4+2]<<8)|block[i*4+3];
  for(let j=16;j<68;j++) W[j]=(rotl32(W[j-16]^W[j-9]^rotl32(W[j-3],15),15)^rotl32(W[j-13],7)^W[j-6])>>>0;
  let[a,b,c,d,e,f,g,h]=Array.from(s);
  for(let j=0;j<64;j++){
    const T=j<16?0x79cc4519:0x7a879d8a;
    const SS1=rotl32((rotl32(a,12)+e+rotl32(T,j%32))>>>0,7);
    const SS2=(SS1^rotl32(a,12))>>>0;
    const ff=j<16?((b^c^d)>>>0):(((b&c)|(b&d)|(c&d))>>>0);
    const gg=j<16?((e^f^g)>>>0):(((e&f)|((~e)&g))>>>0);
    const W1=(W[j]^(j+4<68?W[j+4]:0))>>>0;
    const TT1=(ff+d+SS2+W1)>>>0;
    const TT2=(gg+h+SS1+W[j])>>>0;
    d=c;c=rotl32(b,9);b=a;a=TT1;h=g;g=rotl32(f,19);f=e;e=(rotl32(TT2,9)^rotl32(TT2,17)^(TT2>>>10))>>>0;
  }
  s[0]=(s[0]+a)|0;s[1]=(s[1]+b)|0;s[2]=(s[2]+c)|0;s[3]=(s[3]+d)|0;
  s[4]=(s[4]+e)|0;s[5]=(s[5]+f)|0;s[6]=(s[6]+g)|0;s[7]=(s[7]+h)|0;
}
const SM3_IMPL = {
  init: () => ({ s: new Uint32Array(SM3_IV), count: 0, buffer: new Uint8Array(64), bufferIdx: 0 }),
  update: (state: any, data: Uint8Array) => {
    let offset = 0;
    if (state.bufferIdx > 0) {
      const needed = Math.min(data.length, 64 - state.bufferIdx);
      state.buffer.set(data.subarray(0, needed), state.bufferIdx);
      state.bufferIdx += needed; offset = needed;
      if (state.bufferIdx === 64) { sm3Compress(state.s, state.buffer); state.bufferIdx = 0; }
    }
    while (offset + 64 <= data.length) { sm3Compress(state.s, data.subarray(offset, offset+64)); offset += 64; }
    if (offset < data.length) { state.buffer.set(data.subarray(offset), 0); state.bufferIdx = data.length - offset; }
    state.count += data.length << 3;
  },
  final: (state: any) => {
    const buf = state.buffer; let idx = state.bufferIdx;
    buf[idx++] = 0x80;
    if (idx > 56) { while(idx<64) buf[idx++]=0; sm3Compress(state.s, buf); idx=0; }
    while(idx<56) buf[idx++]=0;
    const view = new DataView(buf.buffer, 56, 8);
    view.setUint32(0, Math.floor(state.count / 0x100000000) >>> 0, false);
    view.setUint32(4, state.count >>> 0, false);
    sm3Compress(state.s, buf);
    const result = new Uint8Array(32);
    for (let i=0;i<8;i++) { result[i*4]=(state.s[i]>>>24)&0xff; result[i*4+1]=(state.s[i]>>>16)&0xff; result[i*4+2]=(state.s[i]>>>8)&0xff; result[i*4+3]=state.s[i]&0xff; }
    return result;
  },
};

// ========== Whirlpool (simplified, non-standard) ==========
// WARNING: Not standard Whirlpool. Only XOR-accumulates blocks.
// TODO: Replace with proper implementation.
const WHIRLPOOL_IMPL = {
  init: () => ({ s: new Uint8Array(64), count: 0, buffer: new Uint8Array(64), bufferIdx: 0 }),
  update: (state: any, data: Uint8Array) => {
    let offset = 0;
    if (state.bufferIdx > 0) {
      const needed = Math.min(data.length, 64 - state.bufferIdx);
      state.buffer.set(data.subarray(0, needed), state.bufferIdx);
      state.bufferIdx += needed; offset = needed;
      if (state.bufferIdx === 64) { for(let i=0;i<64;i++) state.s[i]^=state.buffer[i]; state.bufferIdx=0; }
    }
    while (offset + 64 <= data.length) { const blk=data.subarray(offset,offset+64); for(let i=0;i<64;i++) state.s[i]^=blk[i]; offset+=64; }
    if (offset < data.length) { state.buffer.set(data.subarray(offset), 0); state.bufferIdx = data.length - offset; }
    state.count += data.length;
  },
  final: (state: any) => {
    const buf = state.buffer; let idx = state.bufferIdx;
    buf[idx++] = 0x80; while(idx<64) buf[idx++]=0;
    for(let i=0;i<64;i++) state.s[i]^=buf[i];
    return new Uint8Array(state.s);
  },
};

// ========== xxHash64 ==========
const XXH_P1=0x9E3779B185EBCA87n,XXH_P2=0x14DEF9DEA2F79CD6n,XXH_P5=0x27D4EB2F165667C5n;
const XXHASH64_IMPL = {
  init: () => ({ seed: 0n, buffer: new Uint8Array(0), totalLen: 0n }),
  update: (state: any, data: Uint8Array) => {
    const merged = new Uint8Array(state.buffer.length + data.length);
    merged.set(state.buffer); merged.set(data, state.buffer.length);
    state.buffer = merged; state.totalLen += BigInt(data.length);
  },
  final: (state: any) => {
    const buf = state.buffer;
    let h64 = (state.seed + XXH_P5 + state.totalLen) & 0xFFFFFFFFFFFFFFFFn;
    let off = 0;
    while (off + 8 <= buf.length) {
      const k1 = (BigInt(buf[off])|(BigInt(buf[off+1])<<8n)|(BigInt(buf[off+2])<<16n)|(BigInt(buf[off+3])<<24n)|(BigInt(buf[off+4])<<32n)|(BigInt(buf[off+5])<<40n)|(BigInt(buf[off+6])<<48n)|(BigInt(buf[off+7])<<56n)) & 0xFFFFFFFFFFFFFFFFn;
      h64 = (((h64 ^ ((k1 * XXH_P2) & 0xFFFFFFFFFFFFFFFFn)) << 1n) | ((h64 ^ ((k1 * XXH_P2) & 0xFFFFFFFFFFFFFFFFn)) >> 63n)) & 0xFFFFFFFFFFFFFFFFn;
      h64 = (h64 * XXH_P1) & 0xFFFFFFFFFFFFFFFFn; off += 8;
    }
    if (off + 4 <= buf.length) {
      h64 = (h64 ^ (BigInt((buf[off]|(buf[off+1]<<8)|(buf[off+2]<<16)|(buf[off+3]<<24))>>>0) * XXH_P1)) & 0xFFFFFFFFFFFFFFFFn;
      h64 = (((h64 << 23n) | (h64 >> 41n)) & 0xFFFFFFFFFFFFFFFFn) * XXH_P2 + XXH_P5; off += 4;
    }
    while (off < buf.length) { h64 = (h64 ^ (BigInt(buf[off]) * XXH_P5)) & 0xFFFFFFFFFFFFFFFFn; h64 = ((h64 << 11n) | (h64 >> 53n)) & 0xFFFFFFFFFFFFFFFFn; h64 = (h64 * XXH_P1) & 0xFFFFFFFFFFFFFFFFn; off++; }
    h64 ^= h64 >> 33n; h64 = (h64 * XXH_P2) & 0xFFFFFFFFFFFFFFFFn; h64 ^= h64 >> 29n; h64 = (h64 * 0x165667B19E3779F9n) & 0xFFFFFFFFFFFFFFFFn; h64 ^= h64 >> 32n;
    const result = new Uint8Array(8);
    for (let i=7;i>=0;i--) { result[i]=Number(h64 & 0xFFn); h64 >>= 8n; }
    return result;
  },
};

// ========== xxHash3 (simplified, non-standard) ==========
// WARNING: Not standard xxHash3. Extends xxHash64 with XOR masking.
// TODO: Replace with proper implementation.
const XXHASH3_IMPL = {
  init: () => XXHASH64_IMPL.init(),
  update: (s: any, d: Uint8Array) => XXHASH64_IMPL.update(s, d),
  final: (s: any) => {
    const h64 = XXHASH64_IMPL.final(s); const r = new Uint8Array(16); r.set(h64, 0);
    for (let i=0;i<8;i++) r[8+i] = h64[i] ^ 0x9E; return r;
  },
};

// ========== Adler-32 ==========
const ADLER32_IMPL = {
  init: () => ({ a: 1, b: 0 }),
  update: (state: any, data: Uint8Array) => {
    let a = state.a, b = state.b;
    for (let i = 0; i < data.length; i++) { a = (a + data[i]) % 65521; b = (b + a) % 65521; }
    state.a = a; state.b = b;
  },
  final: (state: any) => {
    const val = ((state.b << 16) | state.a) >>> 0;
    return new Uint8Array([(val >>> 24) & 0xFF, (val >>> 16) & 0xFF, (val >>> 8) & 0xFF, val & 0xFF]);
  },
};

// Register all algorithms
Registry.register('md5', { source: 'pure-js', category: 'legacy', blockSize: 64, hashSize: 16, hexLength: 32, hmac: true, ...MD5_IMPL });
Registry.register('sm3', { source: 'pure-js', category: 'legacy', blockSize: 64, hashSize: 32, hexLength: 64, hmac: true, ...SM3_IMPL });
Registry.register('whirlpool', { source: 'pure-js', category: 'legacy', blockSize: 64, hashSize: 64, hexLength: 128, hmac: false, nonStandard: true, ...WHIRLPOOL_IMPL });
Registry.register('xxhash64', { source: 'pure-js', category: 'fast', blockSize: 8, hashSize: 8, hexLength: 16, hmac: false, ...XXHASH64_IMPL });
Registry.register('xxhash3', { source: 'pure-js', category: 'fast', blockSize: 16, hashSize: 16, hexLength: 32, hmac: false, nonStandard: true, ...XXHASH3_IMPL });
Registry.register('crc32', { source: 'pure-js', category: 'fast', blockSize: 4, hashSize: 4, hexLength: 8, hmac: false, ...CRC32 });
Registry.register('crc32c', { source: 'pure-js', category: 'fast', blockSize: 4, hashSize: 4, hexLength: 8, hmac: false, ...CRC32C });
Registry.register('adler32', { source: 'pure-js', category: 'fast', blockSize: 4, hashSize: 4, hexLength: 8, hmac: false, ...ADLER32_IMPL });

// noble-hashes algorithms
const nobleNames = ['sha1','sha256','sha384','sha512','sha3_256','sha3_384','sha3_512','blake2b_256','blake2b_512','blake2s_256','blake3','ripemd160'];
const nobleMeta: Record<string, any> = {
  sha1: { category: 'standard', blockSize: 64, hashSize: 20, hexLength: 40 },
  sha256: { category: 'standard', blockSize: 64, hashSize: 32, hexLength: 64 },
  sha384: { category: 'standard', blockSize: 128, hashSize: 48, hexLength: 96 },
  sha512: { category: 'standard', blockSize: 128, hashSize: 64, hexLength: 128 },
  sha3_256: { category: 'modern', blockSize: 136, hashSize: 32, hexLength: 64 },
  sha3_384: { category: 'modern', blockSize: 104, hashSize: 48, hexLength: 96 },
  sha3_512: { category: 'modern', blockSize: 72, hashSize: 64, hexLength: 128 },
  blake2b_256: { category: 'modern', blockSize: 128, hashSize: 32, hexLength: 64 },
  blake2b_512: { category: 'modern', blockSize: 128, hashSize: 64, hexLength: 128 },
  blake2s_256: { category: 'modern', blockSize: 64, hashSize: 32, hexLength: 64 },
  blake3: { category: 'modern', blockSize: 64, hashSize: 32, hexLength: 64 },
  ripemd160: { category: 'modern', blockSize: 64, hashSize: 20, hexLength: 40 },
};
for (const name of nobleNames) {
  const adapter = getNobleAdapter(name);
  const meta = nobleMeta[name];
  if (adapter && meta) Registry.register(name, { source: 'noble', hmac: true, ...meta, init: adapter.init, update: adapter.update, final: adapter.final });
}

// Compute engine
export async function calculateMultipleHashes(file: File, algorithms: string[], options: any = {}) {
  const { onProgress = null, signal = null, chunkSizeOverride = null } = options;
  const startTime = Date.now();
  const resultFormat = SettingsManager.get('resultFormat') || 'lowercase';
  const hashAlgos = algorithms.filter((a) => !a.startsWith('hmac-'));
  const chunkInfo = getOptimalChunkInfo(file.size, hashAlgos.length);
  const chunkSize = chunkSizeOverride || chunkInfo.size;

  const WEB_CRYPTO_THRESHOLD = 256 * 1024 * 1024;
  if (file.size < WEB_CRYPTO_THRESHOLD) {
    const results: Record<string, string> = {};
    const ab = await file.arrayBuffer();
    const data = new Uint8Array(ab);
    for (const algo of hashAlgos) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const cfg = Registry.get(algo);
      if (!cfg) { results[algo] = 'Unsupported'; continue; }
      try {
        if (['sha1','sha256','sha384','sha512'].includes(algo) && globalThis.crypto?.subtle) {
          results[algo] = bufferToHex(await digest(algo, data), resultFormat);
        } else {
          const state = cfg.init(); cfg.update(state, data); results[algo] = bufferToHex(cfg.final(state), resultFormat);
        }
        if (onProgress) onProgress({ processed: file.size, total: file.size, percentage: 100, chunkSize });
      } catch (e: any) { results[algo] = `Error: ${e.message}`; }
    }
    return { filename: file.name, size: file.size, hashValues: results, duration: Date.now() - startTime, chunkSize, chunkLabel: chunkInfo.label, chunkDetail: chunkInfo.detail, chunkMode: chunkSizeOverride ? 'manual' : 'auto' };
  }

  const instances: Record<string, any> = {};
  for (const algo of hashAlgos) { const cfg = Registry.get(algo); if (cfg) instances[algo] = { state: cfg.init(), update: cfg.update, final: cfg.final }; }
  const activeAlgos = Object.keys(instances);
  let processedBytes = 0, offset = 0, lastYield = Date.now();
  while (offset < file.size) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const end = Math.min(offset + chunkSize, file.size);
    const ab = await file.slice(offset, end).arrayBuffer();
    const chunk = new Uint8Array(ab);
    for (const algo of activeAlgos) instances[algo].update(instances[algo].state, chunk);
    processedBytes += chunk.byteLength; offset += chunk.byteLength;
    if (onProgress) onProgress({ processed: processedBytes, total: file.size, percentage: Math.round((processedBytes / file.size) * 100), chunkSize });
    const now = Date.now();
    if (offset < file.size && now - lastYield > 50) { await new Promise((r) => setTimeout(r, 0)); lastYield = Date.now(); }
  }
  const results: Record<string, string> = {};
  for (const algo of activeAlgos) {
    try { results[algo] = bufferToHex(instances[algo].final(instances[algo].state), resultFormat); }
    catch (e: any) { results[algo] = `Error: ${e.message}`; }
  }
  return { filename: file.name, size: file.size, hashValues: results, duration: Date.now() - startTime, chunkSize, chunkLabel: chunkInfo.label, chunkDetail: chunkInfo.detail, chunkMode: chunkSizeOverride ? 'manual' : 'auto' };
}
export const Engine = { calculateMultipleHashes, getOptimalChunkInfo };
