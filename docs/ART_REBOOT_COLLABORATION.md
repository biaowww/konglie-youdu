# Reboot 并行开发边界与 ChatGPT 指令

## 工作区

| 目录 | 分支 | 写作者 | 用途 |
|---|---|---|---|
| `konglie-youdu/` | `v1-playable` | 集成负责人 | 公开基线，不并行编辑 |
| `konglie-youdu-chi/` | `chi-polish` | Kimi | 旧产品精修参考 |
| `konglie-youdu-art-kimi/` | `art-reboot-kimi` | Kimi | Kimi 的统一美术与可玩切片 |
| `konglie-youdu-art-reboot/` | `art-reboot` | ChatGPT | ChatGPT 的统一美术与可玩切片 |

禁止跨工作区写入，禁止 `git reset --hard`、`git clean -fd` 和强制推送。每个分支只提交自己的内容；合并与公开发布由集成负责人在试玩验收后执行。

## 可直接发送给 ChatGPT 的指令

```text
你是《空裂：游渡》art-reboot 路线的唯一写作者。只工作于：
/Users/wvngbvao483/offcircle_dev/konglie-youdu-art-reboot

分支已经是 art-reboot。不要修改其他工作区或其他分支，不要执行 git reset --hard、git clean -fd、强制推送、合并或公开发布。Kimi 在 konglie-youdu-art-kimi 开发另一套候选，不要读取后覆盖它的文件。

目标：制作一个独立、统一、可实际操作的全新美术原型，不是旧图抠图、贴图拼贴或 PPT 播放。包括：
1. 最多 1–2 页传统漫画，逐格揭示，每格有局部动效；少量对话说明游离开位面城、回卦山寻找主人。
2. 漫画后的独立开始界面。
3. 痴关卡垂直切片：自然猫、颈挂小玉玦、猫神像、探灯找三个“痴”、隐引导、煤油灯幻境、忿场景化干扰和表里 UI。

美术要求：
- 03 Art 旧图只作风格参考或收藏插图，不作为主场景直接拼贴，不自动抠碎点原图。
- 角色、神像、玉玦、煤油灯、UI 和场景必须按同一套马克笔＋水粉＋彩色铅笔、纸张颗粒、低饱和色板重新生成。
- 用连贯大色块与清晰剪影，保证手机小尺寸可读，不要碎点轮廓、光滑3D、矢量扁平图标或白色矩形贴图。
- 游保持自然猫科四肢比例，不直立、不邮差包、不拟人；玉玦通过真实挂绳和毛发遮挡长在角色颈间，不是悬浮图标。
- 神像必须是带底座的完整游戏 sprite；UI 必须是统一手绘套件，不能混用通用线性图标。
- 先读 Drive/biaoOS/domains/konglie/assets/AI_Art_Pipeline_Runtime.md，使用既定模型、路径和专用凭证，不自行更换模型或 Key，不批量付费出图；先小样，审核后扩展。
- 原始图片太大时先制作提交用缩略参考，保持原图只读。生成的候选图必须标记为 AI 测试，不伪称人工清稿。

只允许写：
- app/art-reboot.html
- app/src/art-reboot/**
- app/public/assets/art-reboot/**
- app/vite.config.ts（仅登记独立 HTML）
- tools/prepare_art_reboot_assets.py
- qa/art-reboot/**
- docs/ART_REBOOT.md

不要修改 App.tsx、App.css、game/content.ts、package.json、锁文件、旧关卡、地图和发布配置。需要新依赖时停止并报告，不自行安装。

交付要求：
- 每步保持可构建、可玩，提供本地 URL，不接受只有图片或文档。
- 运行 npm run build 和 npm run lint。
- 真实浏览器验收四格漫画、开始界面、神像切换、三个痴、忿干扰及 375px 触摸，保存截图、控制台与 404 报告。
- 只在自己的分支提交，不 push、不合并。
- 最后报告实际改动文件、预览 URL、验证结果和未完成原因，等待集成验收。
```
