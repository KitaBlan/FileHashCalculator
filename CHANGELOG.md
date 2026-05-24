# 变更日志 / Changelog

## [4.0.0] — 2026-05-24

### 重大变更
- **TypeScript 重构**: 从纯 JS 迁移到 TypeScript + Vite 构建
- **算法扩展**: 从 7 种扩展到 20 种算法
- **i18n 完整覆盖**: 中英文双语支持，~318 key
- **零 CDN 依赖**: Tailwind CSS 构建时生成，Lucide tree-shaking

### 新增功能
- 新增 SHA3-256/384/512、BLAKE2b-256/512、BLAKE2s-256、BLAKE3、RIPEMD-160
- 新增 SM3 国密哈希
- 新增 Whirlpool、CRC32C、Adler-32
- 新增 xxHash64、xxHash3 快速哈希
- 新增 HMAC 模式（所有加密算法）
- 新增智能分块系统
- 新增智能哈希识别
- 新增批量校验（.sha256sum / .md5sum / .sfv）
- 新增文本哈希输入
- 新增导出弹窗（TXT/CSV/JSON + 实时预览）
- 新增设置弹窗（主题/语言/输出格式/导出格式/自动计算）
- 新增历史记录（IndexedDB）
- 新增交互式教程（3 个）
- 新增暗色/亮色/跟随系统主题
- 新增键盘快捷键
- 新增 XSS 防护
- 新增移动端响应式设计

### 移除
- 移除 CDN 依赖（Tailwind CSS 运行时 + Lucide CDN）
- 移除旧 js/、css/、tests/ 目录

### 依赖
- @noble/hashes ^1.7.0
- lucide ^0.544.0
- Vite 8 + TypeScript 6
- Tailwind CSS 4

## [3.0.0] — 原始版本

- 纯前端文件哈希计算器
- 支持 MD5、SHA-1、SHA-256、SHA-384、SHA-512
- 支持 HMAC-MD5、HMAC-SHA1、HMAC-SHA256
- 文件拖拽、进度条、结果导出
- CDN 加载 Tailwind CSS + Lucide

---

[GitHub](https://github.com/KitaBlan/FileHashCalculator)
