# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Developer Preferences (最高优先级)

1. **全程使用中文对话** — 所有回复、说明、提问均使用中文。
2. **代码添加中英文注释** — 新增或修改代码时，关键逻辑处添加中英文双语注释。
3. **修改代码前深思** — 增删改查代码前再三思考是否合适，如有疑虑先向用户确认。
4. **主动联网搜索** — 遇到不确定的技术细节、API 文档、最新版本信息时，主动搜索而非仅依赖内置知识。

## Project Overview

文件哈希计算器 (FileHashCalculator) — 纯前端文件哈希计算 Web 应用，支持 20 种哈希算法（MD5、SHA-1/256/384/512、SHA3-256/384/512、BLAKE2b-256/512、BLAKE2s-256、BLAKE3、RIPEMD-160、SM3、Whirlpool、CRC32/CRC32C、Adler-32、xxHash64/xxHash3）及 HMAC 模式（可为 13 种支持 HMAC 的算法生成 HMAC 变体）。所有计算在浏览器本地完成，使用 Web Crypto API + noble-hashes + 纯 JS fallback。

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

- **`main.ts`** — 应用入口，初始化引擎、状态、i18n，绑定全局事件（拖拽、粘贴、快捷键），包含主题切换、语言切换、Toast、设置弹窗、导出弹窗、交互式教程等全部 UI 逻辑（~447 行）
- **`ui/render.ts`** — UI 渲染层，所有 DOM 构建和更新逻辑（~13KB，从 main.ts 拆分），包含进度条、结果列表、多文件比对、Toast、设置及导出弹窗模板
- **`core/engine.ts`** — 计算引擎，混合策略（Web Crypto + noble-hashes + 纯 JS），注册全部 20 种算法，包含 MD5/SM3/Whirlpool/xxHash64/xxHash3/Adler-32 纯 JS 实现（~375 行）
- **`core/algorithms/registry.ts`** — 统一的算法注册表接口，支持按分类/十六进制长度查询
- **`core/algorithms/noble.ts`** — noble-hashes 适配器（12 种算法），暴露统一增量接口（init/update/final），同时提供 HMAC 计算
- **`core/algorithms/web-crypto.ts`** — Web Crypto API 适配器，仅支持 SHA-1/256/384/512 的一次性 digest 和 HMAC sign
- **`core/algorithms/crc32.ts`** — CRC32/CRC32C 纯 JS 实现（查表法）
- **`i18n/zh.ts` + `i18n/en.ts`** — 中英文翻译字典（~318 key）
- **`i18n/index.ts`** — i18n 引擎（嵌套 key 如 `algo.sha256.desc`、`{{var}}` 插值、中文回退）
- **`state/store.ts`** — 发布-订阅状态管理，泛型类型安全访问
- **`utils/storage.ts`** — 设置管理（localStorage），key = `hashCalculatorSettings`
- **`utils/db.ts`** — 历史记录（IndexedDB），数据库名 `FileHashCalculator`，支持搜索和自动清理（过期/超量）
- **`utils/`** — 工具函数：format（文件大小格式化）、dom（HTML 转义）、clipboard（剪贴板复制）、download（TXT/CSV/JSON 导出及文件下载）
- **`styles/main.css`** — Tailwind CSS v4 入口 + 自定义 CSS 变量（颜色、间距、圆角）
- **`styles/themes.css`** — 亮/暗色主题变量
- **`styles/animations.css`** — 过渡与动画（toast 进入/退出、进度条等）
- **`types/css.d.ts`** — CSS 模块类型声明

### 关键实现细节

- **哈希算法**: 20 种（8 纯 JS + 12 noble-hashes），HMAC 模式可选（noble-hashes 提供 `hmac()` 函数，支持 13 种算法生成 HMAC 变体）
- **混合策略**: 小文件（< 256MB）走 Web Crypto 原生加速（仅 SHA-1/256/384/512），大文件通过 File.slice() 分块增量计算；主线程计算每 50ms 通过 `setTimeout` 让出给 UI
- **智能分块**: 根据文件大小和设备内存自动选择分块大小（32KB ~ 4MB），可通过设置手动覆盖
- **多算法优化**: 文件只读一次（或按块读一次），同时更新所有算法实例，避免重复 I/O
- **设置存储**: `localStorage` key = `hashCalculatorSettings`，包含语言、主题、分块模式、结果格式、导出格式
- **历史存储**: `IndexedDB` 数据库 `FileHashCalculator`，object store `history`，按时间戳索引，支持搜索（文件名/哈希值）和自动清理（保留 30 天 + 最多 500 条）
- **导出格式**: 支持 TXT（含时间戳）、CSV（逗号分隔）、JSON（格式化）三种导出
- **样式**: Tailwind CSS v4（构建时生成，`@tailwindcss/vite` 插件）+ 自定义 CSS 变量
- **图标**: Lucide (`lucide` 包)，通过 `createIcons({ icons })` tree-shaking 渲染
- **暗色模式**: `data-theme="dark"` attribute on `<html>`，通过 `@custom-variant` 适配 Tailwind，支持亮色/暗色/跟随系统三种模式
- **交互式教程**: 3 个教程（首次哈希、验证下载、多文件比对），通过高亮目标元素 + 遮罩层实现引导
- **智能哈希识别**: 粘贴哈希值时根据十六进制长度自动识别可能的算法类型
- **批量校验**: 粘贴期望哈希值后自动比对所有计算结果

### 构建产物

- `dist/index.html` — 主页面，直接打开可用，无需服务器
- `dist/assets/index-*.js` — 应用代码（~35KB gzipped）
- `dist/assets/index-*.css` — 样式（~2KB gzipped）

### 依赖

- **运行时**: `@noble/hashes` (密码学)、`lucide` (图标)
- **开发**: `vite`、`typescript`、`@tailwindcss/vite`、`eslint`、`prettier`、`eslint-config-prettier`

### 配置要点

- **Vite**: 开发端口 3000，自动打开浏览器，路径别名 `@` → `src/`，构建开启 sourcemap，`@tailwindcss/vite` 插件
- **TypeScript**: target ES2020，strict 模式 + `noImplicitAny`，含 `WebWorker` lib（预留）、`DOM.Iterable`
- **ESLint**: `@eslint/js` v10 推荐规则，`no-unused-vars` 警告级，忽略 `dist/`、`node_modules/`、`js/`
- **Prettier**: `eslint-config-prettier` 集成，避免规则冲突
- **import 策略**: 内部模块使用 `.ts` 扩展名（`import './core/engine.ts'`），Vite 开发模式原生支持

## Language

中文 UI 项目。所有用户可见字符串、注释、文档均使用中文（zh-CN）。技术术语保留英文。
