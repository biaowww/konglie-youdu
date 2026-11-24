# sgp-dev / Claude 独立开发交接

## 协作边界

- 本地预留分支：`art-reboot-claude`，工作区：`/Users/wvngbvao483/offcircle_dev/konglie-youdu-claude`。
- sgp-dev 如在另一台机器上，应 clone `https://github.com/biaowww/konglie-youdu` 并 checkout `art-reboot-claude`，完成后 push 同一分支，不直接覆盖 `art-reboot-kimi`。
- 不允许多个写作者同时改同一工作区。最终合并由同一个集成负责人执行。

## 开始前必须验证，不可预设

1. G Drive／MCP 的实际可读路径与写入权限，不要只凭插件名称判断。
2. Node、npm、Python、图像处理与浏览器验收能力。
3. OpenRouter 的专用凭证是否存在，不得借用其他 session 的 Key。
4. 本机 ComfyUI 是否可访问。若不可访问，不要假设能调用本机模型或进程；改为使用明确授权的 OpenRouter 管线，或先报告阻塞。
5. 先读 `03 Art` 原始美术和 `docs/ART_REBOOT.md`，不要从其他模型的摘要重新概括风格。

## 开发目标

做一套独立的 `art-reboot-claude` 候选，重点不是复制 Kimi 版本，而是解决：

- 分镜必须能表达世界、游为何出发与寻找主人，末格不做单关教学。
- 自然猫、神像、玉玦与环境一体化，禁止悬浮饰物与 sticker 拼贴。
- 墨点、飞白、抽象形体、非对称与中式散点透视，不要现代写实、3D 和通用 AI 奇幻插画。
- 每格有独立版式与局部动效，不能只把图塞进网格或平移缩放。
- 痴关卡保留“移动光圈→看清痴→点击”的轻引导，不让教程压过世界观。

## 文件与发布边界

- 新实现放在 `app/art-reboot.html`、`app/src/art-reboot/**`、`app/public/assets/art-reboot/**`、`qa/art-reboot/**`、`docs/ART_REBOOT.md`。
- `app/vite.config.ts` 只能登记独立 HTML，不改旧游戏入口。
- 不改 `App.tsx`、`App.css`、旧关卡、地图、package.json、锁文件和发布配置，不自行新增依赖。
- 美术候选输出到 `03 Art/AI生成资产/claude/`，不输出到 `ProjectBreach/美术Art`，不覆盖原图。
- 每步保持可构建、可玩，运行 `npm run build`、`npm run lint` 和真实桌面／375px 浏览器验收。
- 不强制推送、不合并、不公开新 URL。提交 `art-reboot-claude` 后由集成负责人审查并决定合并。
