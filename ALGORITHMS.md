# 算法参考文档 / Algorithm Reference

## 算法速查表

| 算法 | 实现 | 块大小 | 输出 | Hex 长度 | HMAC |
|------|------|--------|------|----------|------|
| MD5 | 纯 JS | 64 B | 128 bit | 32 | ✅ |
| SHA-1 | noble-hashes | 64 B | 160 bit | 40 | ✅ |
| SHA-256 | noble-hashes | 64 B | 256 bit | 64 | ✅ |
| SHA-384 | noble-hashes | 128 B | 384 bit | 96 | ✅ |
| SHA-512 | noble-hashes | 128 B | 512 bit | 128 | ✅ |
| SHA3-256 | noble-hashes | 136 B | 256 bit | 64 | ✅ |
| SHA3-384 | noble-hashes | 104 B | 384 bit | 96 | ✅ |
| SHA3-512 | noble-hashes | 72 B | 512 bit | 128 | ✅ |
| BLAKE2b-256 | noble-hashes | 128 B | 256 bit | 64 | ✅ |
| BLAKE2b-512 | noble-hashes | 128 B | 512 bit | 128 | ✅ |
| BLAKE2s-256 | noble-hashes | 64 B | 256 bit | 64 | ✅ |
| BLAKE3 | noble-hashes | 64 B | 256 bit | 64 | ✅ |
| RIPEMD-160 | noble-hashes | 64 B | 160 bit | 40 | ✅ |
| SM3 | 纯 JS | 64 B | 256 bit | 64 | ✅ |
| Whirlpool | 纯 JS | 64 B | 512 bit | 128 | — |
| CRC32 | 纯 JS | 4 B | 32 bit | 8 | — |
| CRC32C | 纯 JS | 4 B | 32 bit | 8 | — |
| Adler-32 | 纯 JS | 4 B | 32 bit | 8 | — |
| xxHash64 | 纯 JS | 8 B | 64 bit | 16 | — |
| xxHash3 | 纯 JS | 16 B | 128 bit | 32 | — |

## 混合计算策略

- **小文件 (< 256 MB)**: 使用 Web Crypto API 一次性计算（SHA-1/256/384/512），其他算法使用 noble-hashes 或纯 JS
- **大文件 (≥ 256 MB)**: 全部使用增量计算，内存占用恒定

## 算法选择建议

| 场景 | 推荐算法 |
|------|----------|
| 文件校验 | SHA-256 + MD5 |
| 安全验证 | SHA-256 + SHA-512 + BLAKE3 |
| 快速校验 | CRC32 + xxHash3 |
| 国密合规 | SM3 + SHA-256 |
| 新一代首选 | BLAKE3 |
| 通用首选 | SHA-256 |

## 参考

- [@noble/hashes](https://github.com/paulmillr/noble-hashes) — 零依赖、审计级纯 JS 密码学库
- [Web Crypto API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [RFC 1321 (MD5)](https://www.rfc-editor.org/rfc/rfc1321)
- [GB/T 32905-2016 (SM3)](https://openstd.samr.gov.cn/)
