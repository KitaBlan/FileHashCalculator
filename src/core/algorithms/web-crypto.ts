/**
 * Web Crypto API 适配器 / Web Crypto API Adapter
 *
 * 仅用于小文件一次性计算（不支持增量）
 * Only for small files one-shot (no incremental support)
 *
 * @module core/algorithms/web-crypto
 */

const ALGO_MAP: Record<string, string> = { sha1: 'SHA-1', sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' };

export async function digest(algorithm: string, data: Uint8Array): Promise<Uint8Array> {
  const algo = ALGO_MAP[algorithm];
  if (!algo) throw new Error(`Web Crypto unsupported: ${algorithm}`);
  // TS6 Uint8Array 泛型兼容 / TS6 Uint8Array generic compatibility
  const hashBuffer = await globalThis.crypto.subtle.digest(algo, data as BufferSource);
  return new Uint8Array(hashBuffer);
}

export async function hmacSign(algorithm: string, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const algo = ALGO_MAP[algorithm];
  if (!algo) throw new Error(`Web Crypto unsupported HMAC: ${algorithm}`);
  const cryptoKey = await globalThis.crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: algo }, false, ['sign']);
  const sig = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, data as BufferSource);
  return new Uint8Array(sig);
}
export const WebCryptoAdapter = { digest, hmacSign, isAvailable: () => !!globalThis.crypto?.subtle, supportedAlgorithms: Object.keys(ALGO_MAP) };
