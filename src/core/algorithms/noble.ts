/**
 * noble-hashes 适配器 / noble-hashes Adapter
 *
 * 封装 @noble/hashes，暴露统一增量接口
 * Wraps @noble/hashes, exposes unified incremental interface
 *
 * @module core/algorithms/noble
 */
import { sha1 } from '@noble/hashes/sha1';
import { sha256 } from '@noble/hashes/sha256';
import { sha384, sha512 } from '@noble/hashes/sha512';
import { sha3_256, sha3_384, sha3_512 } from '@noble/hashes/sha3';
import { blake2b } from '@noble/hashes/blake2b';
import { blake2s } from '@noble/hashes/blake2s';
import { blake3 } from '@noble/hashes/blake3';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { hmac } from '@noble/hashes/hmac';

/** 创建增量适配器 / Create incremental adapter */
function createAdapter(HashClass: any) {
  return {
    init: () => HashClass.create(),
    update: (state: any, data: Uint8Array) => { state.update(data); },
    final: (state: any) => new Uint8Array(state.digest()),
  };
}

const adapters: Record<string, any> = {
  sha1: createAdapter(sha1),
  sha256: createAdapter(sha256),
  sha384: createAdapter(sha384),
  sha512: createAdapter(sha512),
  sha3_256: createAdapter(sha3_256),
  sha3_384: createAdapter(sha3_384),
  sha3_512: createAdapter(sha3_512),
  blake2b_256: { init: () => blake2b.create({ dkLen: 32 }), update: (s: any, d: Uint8Array) => s.update(d), final: (s: any) => new Uint8Array(s.digest()) },
  blake2b_512: { init: () => blake2b.create({ dkLen: 64 }), update: (s: any, d: Uint8Array) => s.update(d), final: (s: any) => new Uint8Array(s.digest()) },
  blake2s_256: { init: () => blake2s.create({ dkLen: 32 }), update: (s: any, d: Uint8Array) => s.update(d), final: (s: any) => new Uint8Array(s.digest()) },
  blake3: createAdapter(blake3),
  ripemd160: createAdapter(ripemd160),
};

export function getNobleAdapter(name: string) { return adapters[name] || null; }

export function computeHmac(hashName: string, key: Uint8Array, data: Uint8Array): Uint8Array {
  const hashMap: Record<string, any> = { sha1, sha256, sha384, sha512, sha3_256, sha3_384, sha3_512, blake2b, blake2s, blake3, ripemd160 };
  const hashFn = hashMap[hashName];
  if (!hashFn) throw new Error(`Unsupported HMAC hash: ${hashName}`);
  return new Uint8Array(hmac(hashFn, key, data));
}

export const NobleAdapter = { get: getNobleAdapter, computeHmac, supportedAlgorithms: Object.keys(adapters) };
