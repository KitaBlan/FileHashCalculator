/**
 * CRC32 校验算法 / CRC32 Checksum Algorithm
 *
 * 非加密用途，32 位输出 / Non-cryptographic, 32-bit output
 *
 * @module core/algorithms/crc32
 */

const CRC32_TABLE = new Uint32Array(256);
(function() {
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); CRC32_TABLE[i] = c; }
})();

const CRC32C_TABLE = new Uint32Array(256);
(function() {
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? (0x82F63B78 ^ (c >>> 1)) : (c >>> 1); CRC32C_TABLE[i] = c; }
})();

function createCrcAdapter(table: Uint32Array) {
  return {
    init: () => ({ crc: 0xFFFFFFFF }),
    update: (state: any, data: Uint8Array) => { let c = state.crc; for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xFF] ^ (c >>> 8); state.crc = c; },
    final: (state: any) => { const v = (state.crc ^ 0xFFFFFFFF) >>> 0; return new Uint8Array([(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF]); },
  };
}

export const CRC32 = createCrcAdapter(CRC32_TABLE);
export const CRC32C = createCrcAdapter(CRC32C_TABLE);
