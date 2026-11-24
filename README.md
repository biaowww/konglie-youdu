# 空裂：游渡

《空裂：游渡》完整 Web 可玩测试版。游回到卦山寻找渡，在五毒关卡中通过观察、辨形、消除与取舍，逐渐恢复世界的色彩与联系。

## 已实现

- 出城三镜旅行动画（24fps 分层原画＋程序补间测试版）与入山表里过场
- 可复现种子的四层多路线地图，每局三处主题关卡＋一次歇脚，支持缩放与拖动
- 标题页可直接进入“痴 · 美术与交互原型”
- 嗔、痴、慢、疑、贪五个完整可玩关卡
- 游地图头像、隐对话头像、忿干扰、玉佩反馈
- 卡牌概率掉落、翻面与卡册
- 每关复色和路线回放，三次触碰的两界结局
- 本地进度保存、音量控制、程序音频氛围与音效
- 鼠标、触屏和基础键盘操作

## 本地运行

```bash
cd app
npm install
npm run dev -- --host localhost --port 7100 --strictPort
```

打开 `http://localhost:7100/`。开发启动脚本同时监听局域网地址，便于同网络设备测试。

## 构建与检查

```bash
cd app
npm run build
npm run lint
npm run preview -- --host 127.0.0.1 --port 7101
```

完整浏览器验收：

```bash
GAME_URL="http://127.0.0.1:7101/" node ../tools/qa_game.mjs
node ../tools/qa_mobile.mjs
```

## 目录

- `app/`：React + TypeScript + Vite 游戏与 Web 美术副本
- `tools/prepare_assets.py`：只读原始美术，生成本地 Web 资产和来源清单
- `tools/qa_game.mjs`：桌面五关、卡牌与结局真实通关验收
- `tools/qa_mobile.mjs`：375px 移动布局与真实触摸事件验收
- `docs/HANDOFF.md`：后续开发者交接说明
- `docs/ASSETS.md`：资产管线与缺口
- `docs/QA.md`：验收范围与结果
- `docs/PUBLISHING.md`：公开部署入口与发布记录
- `qa/`：验收报告与截图（浏览器 profile 不入库）

## 设计边界

嗔、慢的补全机制，贪的具体数值、卡牌掉率和部分台词是待试玩参数，不应视为最终定稿。正式角色动画清稿、录制配乐、配音、最终 CG 与 Godot 迁移仍属后续工作。

GitHub：`https://github.com/biaowww/konglie-youdu`（public）。

V1 试玩：`https://biaowww.github.io/konglie-youdu/`。
