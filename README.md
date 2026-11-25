# 何以上岸 · ForAshore

[![Deploy GitHub Pages](https://github.com/canvay/cs_ashore/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/canvay/cs_ashore/actions/workflows/deploy-pages.yml)

把备考申论拆成一个个轻量的小工具模块。首个模块「申论黑话挑战」：给你一段大白话场景，选出对应的体制内规范表达。

- **Web 端**：https://canvay.github.io/cs_ashore/
- **小程序端**：微信开发者工具打开 `apps/miniprogram`（appid 已配置）

## 板块

### 指南（Web + 小程序）

面向零基础的考公知识介绍：考公的本质、行测、申论、上海市考大纲解读等。文章以结构化 TS 数据存放在 `packages/guide-data/`（web / 小程序共用），增改文章只需编辑 `src/index.ts`，然后 `pnpm --filter @cs/guide-data build` 同步两端。

### 工具

| 工具 | 说明 | 端 |
| --- | --- | --- |
| 黑话挑战 | 闯关答题 / 60 秒速答 / 分类专练 / 错题重做 | Web + 小程序 |
| 更多工具 | 筹备中 | — |

## 仓库结构

```
cs_ashore/
├── apps/
│   ├── web/               # Vite 6 + React 19 + HeroUI v3 + Tailwind CSS 4
│   └── miniprogram/       # 微信原生 + TypeScript（单页多视图状态机）
├── packages/
│   ├── heihua-data/       # 题库单一来源（data/questions.json 源 + tsc 产 ESM）
│   └── guide-data/        # 指南文章单一来源（web / 小程序共用）
├── assets/brand/          # ForAshore 品牌 logo 源文件
├── scripts/
│   ├── extract-questions.mjs          # 校验题库 JSON 并生成 questions.ts
│   ├── build-miniprogram-data.mjs     # esbuild 打 CJS 同步题库到小程序
│   ├── build-miniprogram-guide-data.mjs # esbuild 打 CJS 同步指南文章到小程序
│   └── build-logo-png.mjs             # 品牌 SVG 转 PNG（小程序 <image> 不支持 SVG）
└── docs/                  # 需求文档 / 技术方案
```

## 快速开始

环境要求：Node ≥ 20、[pnpm](https://pnpm.io) ≥ 12（仓库用 `packageManager` 锁定版本）。

```bash
pnpm install

# Web 端开发
pnpm dev:web

# 小程序端：用微信开发者工具打开 apps/miniprogram 目录即可
pnpm dev:mp        # （提示性脚本）
```

题库改动流程：修改 `packages/heihua-data/src/questions.ts` → `pnpm build`（会跑题库校验并自动同步两端产物）→ 两端重新编译/刷新。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev:web` | Web 端开发服务器 |
| `pnpm build` | 构建所有包（含题库校验 + 双端数据/logo 同步） |
| `pnpm typecheck` | 全仓库 TypeScript 检查 |
| `pnpm logo:png` | 品牌图标 SVG → PNG（输出到小程序 images/） |

## 数据与进度

- 题库来自《申论规范表达8页》整理版，当前 261 题、8 大分类
- 用户进度（最高分 / 累计作答 / 错题本）只保存在本机：Web 用 localStorage，小程序用 wx.storage

## 部署（GitHub Pages）

推送改动到 `main` 且涉及 `apps/web/**` 或 `packages/heihua-data/**` 时，[部署工作流](.github/workflows/deploy-pages.yml) 自动构建并发布。首次启用需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

## 小程序自动上传

[上传工作流](.github/workflows/upload-miniprogram.yml) 基于 `miniprogram-ci`（无需微信开发者工具），推送小程序相关改动到 `main` 自动上传，也可在 Actions 页手动触发（可填版本号/描述）。首次启用需三步：

1. 微信小程序管理后台（mp.weixin.qq.com）→ 开发管理 → 开发设置 → **小程序代码上传密钥**：生成并下载密钥文件（只显示一次）
2. 同页把 **IP 白名单**设为关闭（GitHub runner 的 IP 不固定）
3. GitHub 仓库 → Settings → Secrets and variables → Actions → 新建 secret `MP_UPLOAD_KEY`，值为密钥文件原样内容

上传的代码包出现在后台「版本管理 → 开发版本」（机器人编号 1），确认无误后在后台手动提交审核发布。

## 许可

仅供个人学习备考使用。
