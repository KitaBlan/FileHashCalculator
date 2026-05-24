# 文件哈希计算器 / File Hash Calculator

> 纯前端文件哈希计算器 — 20 种算法，零上传，隐私安全

[![GitHub](https://img.shields.io/badge/GitHub-KitaBlan%2FFileHashCalculator-FF9F45?logo=github)](https://github.com/KitaBlan/FileHashCalculator)
![Version](https://img.shields.io/badge/version-4.0.0-FF9F45)
![License](https://img.shields.io/badge/license-MIT-FF9F45)

一个轻量级、跨平台的 Web 应用，用于计算和验证文件的哈希值，确保文件完整性和安全性。所有计算均在浏览器本地完成，**文件不会上传到任何服务器**。

A lightweight, cross-platform web application for computing and verifying file hashes. All computations are performed locally — **files are never uploaded**.

---

## 功能特点 / Features

### 算法支持 / Supported Algorithms (20 种)

| 分类 | 算法 | 来源 |
|------|------|------|
| 标准 (Standard) | SHA-1, SHA-256, SHA-384, SHA-512 | noble-hashes + Web Crypto 加速 |
| 现代 (Modern) | SHA3-256, SHA3-384, SHA3-512, BLAKE2b-256/512, BLAKE2s-256, BLAKE3, RIPEMD-160 | noble-hashes |
| 传统 (Legacy) | MD5 (纯 JS), SM3 国密 (纯 JS), Whirlpool (纯 JS，非标准简化版) | 纯 JavaScript |
| 快速 (Fast) | CRC32, CRC32C, Adler-32, xxHash64, xxHash3 (简化版) | 纯 JavaScript |
| HMAC 变体 | 13 种加密算法支持 HMAC 模式（SHA 系列、SHA3 系列、BLAKE 系列、RIPEMD-160、MD5、SM3） | noble-hashes hmac |

> **注意**：Whirlpool 和 xxHash3 为简化实现（标记为 `nonStandard: true`），仅用于快速比对，不适用于安全验证。

### 其他功能

- **Web Crypto API 原生加速** — SHA 系列使用浏览器原生 API，5-10x 性能提升
- **智能分块** — 根据文件大小和设备内存自动选择最优分块大小（32KB ~ 4MB，支持手动覆盖）
- **主线程让出** — 大文件计算每 50ms 通过 `setTimeout` 让出主线程，保持 UI 响应
- **智能哈希识别** — 粘贴哈希值自动识别算法类型（根据十六进制长度匹配）
- **批量校验** — 支持手动粘贴哈希比对，也支持多文件之间自动比对
- **中英文界面** — 完整双语支持（318 个翻译 key），一键切换
- **暗色/亮色/跟随系统主题** — 三种模式，`data-theme` 属性切换
- **键盘快捷键** — Ctrl+K 命令面板、Ctrl+O 选择文件、Ctrl+Enter 开始计算、Ctrl+E 导出、Ctrl+D 切换主题
- **历史记录** — IndexedDB 持久化，支持按文件名/哈希值搜索，自动清理（保留 30 天，最多 500 条）
- **文本哈希** — 直接输入文本计算哈希值
- **导出功能** — 支持 TXT（含时间戳）、CSV（逗号分隔）、JSON（格式化）三种格式
- **交互式教程** — 3 个边学边做教程（首次哈希、验证下载、多文件比对），遮罩层 + 元素高亮引导
- **响应式设计** — 适配桌面、平板、手机

---

## 项目架构 / Architecture

```
src/
├── main.ts                    # 应用入口，全部 UI 交互逻辑
├── ui/render.ts               # UI 渲染层，所有 DOM 模板
├── core/
│   ├── engine.ts              # 计算引擎，20 种算法注册 + 分块调度
│   └── algorithms/
│       ├── registry.ts        # 算法注册表（注册/查询/分类）
│       ├── noble.ts           # noble-hashes 适配器（12 种 + HMAC）
│       ├── web-crypto.ts      # Web Crypto API 适配器（SHA 系列）
│       └── crc32.ts           # CRC32/CRC32C 纯 JS
├── i18n/
│   ├── index.ts               # i18n 引擎（嵌套 key + 插值）
│   ├── zh.ts                  # 中文翻译
│   └── en.ts                  # 英文翻译
├── state/store.ts             # 发布-订阅状态管理
├── utils/
│   ├── storage.ts             # 设置持久化 (localStorage)
│   ├── db.ts                  # 历史记录 (IndexedDB)
│   ├── download.ts            # 文件导出 (TXT/CSV/JSON)
│   ├── clipboard.ts           # 剪贴板操作
│   ├── format.ts              # 格式化工具
│   └── dom.ts                 # DOM 工具
├── styles/
│   ├── main.css               # Tailwind CSS v4 + 变量
│   ├── themes.css             # 主题变量
│   └── animations.css         # 动画
└── types/css.d.ts             # CSS 模块类型声明
```

**计算流程**：文件 → 判断大小（< 256MB 走 Web Crypto 一次性 digest，否则分块）→ 每块同时更新所有选中算法 → 主线程每 50ms 让出 → 完成后格式化输出。

---

## 快速开始 / Quick Start

### 直接使用
打开 `dist/index.html` 即可使用，无需服务器。
Open `dist/index.html`, no server required.

### 开发 / Development
```bash
npm install
npm run dev        # 启动 Vite 开发服务器 (localhost:3000)
npm run lint       # ESLint 代码检查
npm run format     # Prettier 格式化
npm run typecheck  # TypeScript 类型检查
```

### 构建 / Build
```bash
npm run build      # tsc 类型检查 + Vite 生产构建
npm run preview    # 预览构建产物
```
产物在 `dist/` 目录，纯静态文件，零外部依赖。

---

## 快捷键 / Shortcuts

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 命令面板 |
| `Ctrl+O` | 选择文件 |
| `Ctrl+Enter` | 开始计算 |
| `Ctrl+E` | 导出结果 |
| `Ctrl+D` | 暗色模式切换 |
| `Escape` | 取消/关闭 |

---

## 技术栈 / Tech Stack

| 类别 | 技术 | 说明 |
|------|------|------|
| 构建 | Vite 8 + TypeScript 6 | ES Modules，路径别名 `@` → `src/` |
| 样式 | Tailwind CSS 4 | `@tailwindcss/vite` 插件构建时生成 |
| 密码学 | @noble/hashes + Web Crypto API + 纯 JS | 三层 fallback 策略 |
| 图标 | Lucide | `createIcons()` tree-shaking 按需加载 |
| 存储 | IndexedDB + localStorage | 历史记录 + 设置 |
| 代码质量 | ESLint 10 + Prettier | 推荐规则 + 格式化 |

---

## 设置项 / Settings

| 设置 | 选项 | 默认值 |
|------|------|--------|
| 语言 | 中文 / English / 自动 | 自动 |
| 主题 | 亮色 / 暗色 / 跟随系统 | 跟随系统 |
| 分块大小 | 自动 / 32K / 64K / 256K / 512K / 1M / 2M / 4M | 自动 |
| 结果格式 | 小写 / 大写 | 小写 |
| 导出格式 | TXT / CSV / JSON | TXT |

---

## 隐私声明 / Privacy

本工具不收集任何用户数据。所有文件计算均在浏览器本地完成，文件不会上传到任何服务器。

This tool does not collect any user data. All file calculations are performed locally in the browser. Files are never uploaded to any server.

---

## 许可证 / License

[MIT License](LICENSE) | [GitHub](https://github.com/KitaBlan/FileHashCalculator)
