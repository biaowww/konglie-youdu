# 给 ChatGPT 的原始美术与 Reboot 指令

```text
你是《空裂：游渡》art-reboot 路线的唯一写作者。只工作于：
/Users/wvngbvao483/offcircle_dev/konglie-youdu-art-reboot

不要修改其他工作区或其他分支，不要执行 reset --hard、clean -fd、强制推送、合并或公开发布。

第一步不是写代码，也不是读其他 AI 的风格总结。请直接打开并分析以下原始美术，自己记录：墨点大小与聚散、飞白、排线、色板、抽象程度、角色轮廓、材质与中式散点透视。不要先把它们概括成“现代马克笔水粉插画”，也不要把其他 AI 生成图当参考。

原始资料根：
/Users/wvngbvao483/Library/CloudStorage/GoogleDrive-wvngbvao483@gmail.com/My Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/03 Art

必须直接查看：
- 角色和关键道具/游/游-形象1（未拟人化）.jpg
- 角色和关键道具/游/游-形象2（未拟人化）.jpg
- 角色和关键道具/游/游-onthemap.png
- 角色和关键道具/渡/游猫.png
- 角色和关键道具/渡/游1.png
- 角色和关键道具/忿-反派/CATCAT24.JPG、CATCAT27.JPG、CATCAT28.JPG、CATCAT29.JPG、CATCAT30.JPG
- 角色和关键道具/隐-引导npc/隐-对话框形象.png
- 猫神像(传送门）/神像6.png
- 场景/五毒/痴/痴 山腰古寺.JPG
- 场景/五毒/痴/煤油灯滤镜干扰.pdf
- ui:CG:演出/ui-elements-cropped.jpg
- ui:CG:演出/ui-elements(按钮、音量等）.jpg
- ui:CG:演出/open+end地形播放展示/ 下的地形图

原始图只读，不改文件名、不覆盖、不移动。提交给图像 API 前如超过请求限制，只在本地制作缩略参考，不改原图。

输出位置：
- ChatGPT 候选：上述 03 Art/AI生成资产/chatgpt/
- 管线对比：上述 03 Art/AI生成资产/comparisons/，文件名使用 chatgpt- 前缀
- 不得输出到 ProjectBreach/美术Art。

然后分别用以下两条管线做同题小样，不要先认定某条更好：
1. OpenRouter GPT Image：按既定模型和专用 Key，直接参考原图。
2. 本地 Mac ComfyUI：使用 ~/my_project/ComfyUI/workflows/kl_zone_concept_t2i_flux_mac_v001.json 与 comfyui_generate.py，不自行更换模型或工作流。
记录 prompt、seed、模型、成本、参考图和结果，明确比较谁更接近原画，而不是谁更“精致”。

美术目标：
- 保留中式写意、墨点泼墨、飞白、抽象形体和原始角色的冷峻气质。
- 不是现代写实奇幻插画，不是3D，不是照片，不是西式焦点透视，不是光滑渲染，不是矢量扁平图标。
- 采用 2D 或 2.5D 平面分层，接近 Paper Mario、Professor Layton 的平面空间组织，以及《大闹天宫》早期有限动画的造型与节奏。
- 动画按少量关键姿态、分层替换和 steps 节奏设计，不追求3D骨骼动作或每一帧都连续平滑运动。
- 游保持自然猫科四肢比例与冷峻感；隐保持抽象猫神像式形象，不改成写实白猫；忿直接提炼原始多色形象。

风格小样通过后，再实现：
1. 最多 1–2 页逐格漫画，少量对话与局部动效。
2. 漫画后的开始界面。
3. 痴关卡可玩切片：自然猫、颈挂小玉玦、抽象猫神像、探灯找三个“痴”、隐引导、煤油灯幻境、忿场景化干扰与表里 UI。

只允许写：
- app/art-reboot.html
- app/src/art-reboot/**
- app/public/assets/art-reboot/**
- app/vite.config.ts（仅登记独立 HTML）
- tools/prepare_art_reboot_assets.py
- qa/art-reboot/**
- docs/ART_REBOOT.md

不要修改 App.tsx、App.css、game/content.ts、package.json、锁文件、旧关卡、地图和发布配置。需要新依赖时停止并报告。

每步保持可构建、可玩，提供本地 URL；运行 npm run build、npm run lint；真实浏览器验收桌面和 375px 触摸，保存截图、控制台与 404 报告。只在自己的分支提交，不 push、不合并。最后报告实际改动、预览 URL、两条管线的风格对比、验证结果与未完成原因。
```
