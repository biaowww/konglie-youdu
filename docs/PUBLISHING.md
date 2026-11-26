# 公开发布记录

## V1 GitHub Pages · 当前主入口

**https://biaowww.github.io/konglie-youdu/**

- 仓库：`https://github.com/biaowww/konglie-youdu`（public）。
- V1 源分支：`v1-playable`；首个提交：`fd4d5d8`。
- 发布：GitHub Actions `Deploy Youdu to GitHub Pages`，构建目录 `app/dist`。
- Pages 环境允许 `main` 与 `v1-playable`；远端 `main` 的历史敏感文件已单独清理，未强推或覆盖其历史。
- 匿名桌面全流程与 375px 触摸验收通过，控制台错误 0、失败资源 0。

## V1 更新方式

1. 修改后运行 `npm run build`、`npm run lint`、桌面与移动验收。
2. 推送 `v1-playable`，由 GitHub Actions 构建并发布精确静态产物。
3. 检查 workflow 成功后，再在公开 URL 重跑关键路径与完整通关。
4. 发布记录更新本文件，验收结果更新 `docs/QA.md`。

## 独立开发预览 · Fable／Opus 切片

**https://biaowww.github.io/konglie-youdu-preview/**

- 预览仓库：`https://github.com/biaowww/konglie-youdu-preview`（public），仅发布构建后的静态文件。
- 入口为当前 `art-reboot` 切片；预览打包时以其 HTML 替换 `index.html`，不改变源仓库的 V1 主入口。
- 与本地电脑、sgp-dev 和 SSH 隧道无关，电脑重启后仍可访问；进度仅存当前浏览器。
- 每次更新运行 build、lint 与真实浏览器验收，再同步 `app/dist` 到预览仓库 `site/`，由 GitHub Actions 分“上传工件／部署”两个 job 发布。
- 痴单关卡全流程于 2026-11-26 在公开地址完成 153/153 验收，桌面与 375px 触摸均通过，控制台错误与失败资源均为 0。
- 不包含密钥、Drive 原始路径、原始美术工程、QA 浏览器 profile 或 `node_modules`。

## 旧版 kimi.link 临时入口

**https://konglie-youdu.ok.kimi.link**

- Website ID：`1a1fea7b-24f2-8810-8000-0000dac06f4a`
- Published version ID：`1a1fea7b-28d2-8706-8000-0000b7f2985a`
- 可见性：`public`
- 类型：纯静态 Web 前端，无后端、账号或数据库
- 首次发布：2026-11-21

## 发布验证

- `kimix website validate static` 通过。
- 发布状态与版本已回读，公开策略与申请一致。
- 匿名 HTML 返回《空裂：游渡 · 完整测试版》。
- 线上 `index-CheIYqVs.js` 与本地最终构建 SHA-256 完全一致：
  `4ac874b2c928f9d4e9fa68e5ef861b8f57b864ebfed3e2682a44dbf763dff222`。
- 在公开 URL 上完成五关、卡牌翻面、复色地图与三次触碰结局；控制台错误与失败资源均为 0。

## 旧版 kimi.link 更新方式

1. 修改源码并重新跑 `npm run build`、`npm run lint`、桌面与移动验收。
2. 从 `app/dist/` 内容重新打包，不包含 `assets/manifest.json`（其中保留本机源路径，仅供内部追溯）。
3. 用 `kimix website validate static` 验证精确 Bundle。
4. 用 `kimix website publish <website-id> static <bundle> --wait` 发布新版本。
5. 回读状态、版本和可见性，并在公开 URL 重跑关键路径。

不要公开发布源目录、node_modules、QA 浏览器 profile、本机密钥或原始 Drive 文件路径。
