# 公开发布记录

## 当前可玩入口

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

## 更新方式

1. 修改源码并重新跑 `npm run build`、`npm run lint`、桌面与移动验收。
2. 从 `app/dist/` 内容重新打包，不包含 `assets/manifest.json`（其中保留本机源路径，仅供内部追溯）。
3. 用 `kimix website validate static` 验证精确 Bundle。
4. 用 `kimix website publish <website-id> static <bundle> --wait` 发布新版本。
5. 回读状态、版本和可见性，并在公开 URL 重跑关键路径。

不要公开发布源目录、node_modules、QA 浏览器 profile、本机密钥或原始 Drive 文件路径。
