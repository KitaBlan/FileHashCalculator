# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Developer Preferences (最高优先级)

1. **全程使用中文对话** — 所有回复、说明、提问均使用中文。
2. **代码添加中英文注释** — 新增或修改代码时，关键逻辑处添加中英文双语注释。
3. **修改代码前深思** — 增删改查代码前再三思考是否合适，如有疑虑先向用户确认。
4. **主动联网搜索** — 遇到不确定的技术细节、API 文档、最新版本信息时，主动搜索而非仅依赖内置知识。

## Project Overview

文件哈希计算器 (FileHashCalculator) — 纯前端文件哈希计算 Web 应用，支持 20 种哈希算法（MD5、SHA-1/256/384/512、SHA3-256/384/512、BLAKE2b/s、BLAKE3、RIPEMD-160、SM3、Whirlpool、CRC32/CRC32C、Adler-32、xxHash64/xxHash3）及 HMAC 模式。所有计算在浏览器本地完成，使用 Web Crypto API + noble-hashes + 纯 JS fallback。

## Commands

```bash
npm install
npm run dev        # Vite 开发服务器 (localhost:3000)
npm run build      # 生产构建 (tsc + vite build)
npm run preview    # 预览构建产物
npm run lint       # ESLint 检查 src/
npm run format     # Prettier 格式化 src/
npm run typecheck  # TypeScript 类型检查 (tsc --noEmit)
```

## Architecture

使用 Vite + TypeScript 构建，ES Modules 模块系统。

### 核心模块 (`src/`)

- **`main.ts`** — 应用入口，初始化引擎、状态、i18n，绑定全局事件（拖拽、粘贴、快捷键）
- **`ui/render.ts`** — UI 渲染层，所有 DOM 构建和更新逻辑（~13KB，从 main.ts 拆分）
- **`core/engine.ts`** — 计算引擎，混合策略（Web Crypto + noble-hashes + 纯 JS），注册全部 20 种算法
- **`core/algorithms/registry.ts`** — 统一的算法注册表接口
- **`core/algorithms/noble.ts`** — noble-hashes 适配器（12 种算法）
- **`core/algorithms/web-crypto.ts`** — Web Crypto API 适配器
- **`core/algorithms/crc32.ts`** — CRC32/CRC32C 纯 JS 实现
- **`i18n/zh.ts` + `i18n/en.ts`** — 中英文翻译字典（~318 key）
- **`i18n/index.ts`** — i18n 引擎（嵌套 key、插值、中文回退）
- **`state/store.ts`** — 发布-订阅状态管理
- **`utils/storage.ts`** — 设置管理（localStorage）
- **`utils/db.ts`** — 历史记录（IndexedDB）
- **`utils/`** — 工具函数（format/dom/clipboard/download）
- **`styles/main.css`** — Tailwind CSS v4 入口 + 自定义变量
- **`styles/themes.css`** — 亮/暗色主题变量
- **`styles/animations.css`** — 过渡与动画

### 关键实现细节

- **哈希算法**: 20 种（8 纯 JS + 12 noble-hashes），HMAC 模式可选
- **混合策略**: 小文件（< 256MB）走 Web Crypto 原生加速，大文件增量计算
- **智能分块**: 根据文件大小和设备内存自动选择分块大小
- **多算法优化**: 文件只读一次，同时更新所有算法实例
- **设置存储**: `localStorage` key = `hashCalculatorSettings`
- **历史存储**: `IndexedDB` 数据库 `FileHashCalculator`
- **样式**: Tailwind CSS v4（构建时生成）+ 自定义 CSS 变量
- **暗色模式**: `data-theme="dark"` attribute on `<html>`，通过 `@custom-variant` 适配 Tailwind

### 构建产物

- `dist/index.html` — 主页面
- `dist/assets/index-*.js` — 应用代码（~35KB gzipped）
- `dist/assets/index-*.css` — 样式（~2KB gzipped）
- `dist/assets/hash.worker-*.js` — Worker 代码（~5KB，独立线程加载）

### 配置要点

- **Vite**: 开发端口 3000，路径别名 `@` → `src/`，构建开启 sourcemap
- **TypeScript**: target ES2020，strict 模式，含 `WebWorker` lib（Worker 线程用）
- **ESLint + Prettier**: 已配置，`npm run lint` / `npm run format`

## Language

中文 UI 项目。所有用户可见字符串、注释、文档均使用中文（zh-CN）。技术术语保留英文。
