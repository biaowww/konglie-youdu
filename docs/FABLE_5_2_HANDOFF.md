# 交给 Fable 5.2：0→1 独立开发交接

> 授权、端口转发与逐步验收操作见 `docs/FABLE_RUNBOOK.md`。

## 模型与工作方式

- 文本与开发：`anthropic/claude-fable-5.2`，已实际返回 `FABLE_5_2_OK`。
- 图像生成：`openai/gpt-image-2.6-sunburst`，已通过既定 `openrouter_image.py` 实际生成并读取测试图。Fable 本身不负责生图，应调用已验证的 OpenRouter 图像管线。
- 分支：`art-reboot-claude`。工作区：`/Users/wvngbvao483/offcircle_dev/konglie-youdu-claude`。
- sgp-dev 可 clone `https://github.com/biaowww/konglie-youdu` 并 checkout `art-reboot-claude`，完成后 push 同一分支，由集成负责人合并。禁止强推、直接合并或自行公开发布。

## 已验证环境

- G Drive 同步目录与 `03 Art` 原始美术可读，`03 Art/AI生成资产/claude/` 可写。
- Node.js v25.6.1、npm 11.9.0、Python 3.9.6、Pillow 11.3.0。
- Chrome 158.0.8127.37，真实 CDP 浏览器验收已执行。
- 当前分支 `npm ci`、`npm run build`、`npm run lint` 通过。
- `tools/qa_art_reboot.mjs` 已验证四格漫画、开始界面、神像切换、三个痴、375px 触摸，控制台错误与失败资源均为 0。
- GitHub 当前账号具有 admin / maintain / pull / push / triage 与 workflow 权限。

上述是本机验证，不等于 sgp-dev 自身授权。sgp-dev 开始开发前仍需确认其 MCP、文件和凭证状态。

## 开始时的要求

1. 先读主 GDD、关卡流程与 `03 Art` 原始美术，直接分析墨点、飞白、抽象形体、角色轮廓和中式散点透视，不从其他 AI 的总结开始。
2. 先提交一页美术导演与分镜方案供审核，再生成少量关键资产。不要先批量生成整套素材。
3. 可以全面替换本分支现有实现，不要把现有场景、UI、灯或提示词当作必须沿用的基线。
4. 0→1 首个可玩切片只包含：独立开场漫画、开始界面、痴关卡。做到每一步可构建、可玩，不要最后才给可执行文件。

## 产品要求

- 这是 2D／2.5D 中式墨点写意游戏，不是 3D，不是现代写实奇幻插画，不是西式焦点透视。
- 漫画是玩家第一眼，必须有独立版式、景别、镜头和局部动效，说明世界、游为何出发和寻找主人；末格不做单关教学。
- 游保持自然猫科比例与冷峻感，隐保持抽象猫神像式轮廓，忿直接提炼原始多色概念。
- 角色、NPC、item 与场景必须按同一构图与光影设计，禁止 sticker 拼贴、悬浮饰物和无依据漂浮玉玦。
- 神像与 UI 要作为游戏内统一美术重新设计，不能沿用现成抠图；煤油灯也必须与场景同笔触、同色板。
- 角色需要多个视角与关键姿态，不要复杂 3D 动作，使用少量关键姿态和有限动画。
- 痴保留探灯找三个目标，但玩家必须理解为什么找、如何操作、找齐后会发生什么，不能连续弹教程。
- 受众不是硬核玩家，避免复杂数值、战斗与账号系统。

## 文件边界

允许重写：`app/art-reboot.html`、`app/src/art-reboot/**`、`app/public/assets/art-reboot/**`、`qa/art-reboot/**`、`docs/ART_REBOOT.md`。`app/vite.config.ts` 只能登记独立 HTML。

不得修改旧 `App.tsx`、旧关卡、地图、package.json、锁文件和发布配置。需要新增依赖时先报告。美术候选输出到 `03 Art/AI生成资产/claude/`，原始美术只读，不输出到 `ProjectBreach/美术Art`。

## 验收与交付

- 每步提供本地 playable URL，不接受只有生成图或文档。
- 每次修改运行 `npm run build` 和 `npm run lint`；影响流程时跑真实桌面与 375px 浏览器验收，控制台错误与 404 必须为 0。
- 保留分镜与场景截图、生成元数据、实际改动文件、验证结果和未完成原因。
- 完成后只提交 `art-reboot-claude`，不合并、不强制推送、不替换公开 URL，等待集成验收。
