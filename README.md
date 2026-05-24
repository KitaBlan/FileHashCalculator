# 文件哈希计算器 / File Hash Calculator

> 纯前端文件哈希计算器 — 20 种算法，零上传，隐私安全

[![GitHub](https://img.shields.io/badge/GitHub-KitaBlan%2FFileHashCalculator-FF9F45?logo=github)](https://github.com/KitaBlan/FileHashCalculator)
![Version](https://img.shields.io/badge/version-4.0.0-FF9F45)
![License](https://img.shields.io/badge/license-MIT-FF9F45)

一个轻量级、跨平台的 Web 应用，用于计算和验证文件的哈希值，确保文件完整性和安全性。所有计算均在浏览器本地完成，**文件不会上传到任何服务器**。

A lightweight, cross-platform web application for computing and verifying file hashes. All computations are performed locally — **files are never uploaded**.

---

## 功能特点 / Features

### 算法支持 / Supported Algorithms (20+)

| 分类 | 算法 |
|------|------|
| 标准 (Standard) | SHA-1, SHA-256, SHA-384, SHA-512 |
| 现代 (Modern) | SHA3-256, SHA3-384, SHA3-512, BLAKE2b-256/512, BLAKE2s-256, BLAKE3, RIPEMD-160 |
| 传统 (Legacy) | MD5, SM3 (国密), Whirlpool |
| 快速 (Fast) | CRC32, CRC32C, Adler-32, xxHash64, xxHash3 |
| HMAC 变体 | 所有加密算法均支持 HMAC 模式 |

### 其他功能

- **Web Crypto API 原生加速** — SHA 系列使用浏览器原生 API，5-10x 性能提升
- **智能分块** — 根据文件大小和设备内存自动选择最优分块大小
- **智能哈希识别** — 粘贴哈希值自动识别算法类型
- **批量校验** — 支持 .sha256sum / .md5sum / .sfv 格式
- **中英文界面** — 完整双语支持，一键切换
- **暗色/亮色/跟随系统主题** — 三种模式，自动适配
- **键盘快捷键** — Ctrl+K 命令面板、Ctrl+Enter 开始计算
- **历史记录** — IndexedDB 持久化，支持搜索和清理
- **文本哈希** — 直接输入文本计算哈希值
- **交互式教程** — 3 个边学边做教程
- **响应式设计** — 适配桌面、平板、手机

---

## 快速开始 / Quick Start

### 直接使用
打开 `dist/index.html` 即可使用，无需服务器。
Open `dist/index.html`, no server required.

### 开发 / Development
```bash
npm install
npm run dev
```

### 构建 / Build
```bash
npm run build
npm run preview
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
| `Ctrl+D` | 暗色模式 |
| `Escape` | 取消/关闭 |

---

## 技术栈 / Tech Stack

- **构建**: Vite 8 + TypeScript
- **样式**: Tailwind CSS 4 + 自定义 CSS 变量主题
- **密码学**: noble-hashes + Web Crypto API + 纯 JS 实现
- **图标**: Lucide (tree-shaking)
- **存储**: IndexedDB (历史记录) + localStorage (设置)

---

## 隐私声明 / Privacy

本工具不收集任何用户数据。所有文件计算均在浏览器本地完成，文件不会上传到任何服务器。

This tool does not collect any user data. All file calculations are performed locally in the browser. Files are never uploaded to any server.

---

## 许可证 / License

[MIT License](LICENSE) | [GitHub](https://github.com/KitaBlan/FileHashCalculator)
