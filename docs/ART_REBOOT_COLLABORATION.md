# 并行开发边界与 ChatGPT 交接提示词

## 工作区与写入权

| 工作区 | 分支 | 唯一写作者 | 用途 |
|---|---|---|---|
| `konglie-youdu/` | `v1-playable` | 集成负责人 | 保留当前公开基线，不作为并行编辑器 |
| `konglie-youdu-chi/` | `chi-polish` | Kimi Code | 痴关卡精修、多路线与现有产品迭代 |
| `konglie-youdu-art-reboot/` | `art-reboot` | ChatGPT | 独立统一美术、逐格漫画与独立试玩页 |

任何一方不得修改另一方的工作区，不得执行 `git reset --hard`、`git clean -fd` 或强制推送。每个工作区只提交到自己的分支。公开 Pages 与合并由集成负责人在试玩验收后统一处理。

## 可直接交给 ChatGPT 的提示词

```text
你是《空裂：游渡》art-reboot 路线的唯一写作者。只工作于：
/Users/wvngbvao483/offcircle_dev/konglie-youdu-art-reboot

分支已经是 art-reboot，不要切换分支。不要修改：
- /Users/wvngbvao483/offcircle_dev/konglie-youdu
- /Users/wvngbvao483/offcircle_dev/konglie-youdu-chi
- main、v1-playable、chi-polish
- 其他模型的本地修改和未跟踪文件

目标：制作一个可以直接打开并实际操作的“独立统一美术”原型，不是图片展示。包括：
1. 最多 1–2 页传统漫画，逐格出现，每格可有局部动效；少量对话交代游离开位面城、回卦山寻找主人。
2. 漫画结束后有独立游戏开始界面。
3. 一个痴关卡垂直切片：自然猫、颈挂玉玦、猫神像、探灯找三个“痴”、隐引导、忿的场景化干扰。
4. 保留简单交互，不做战斗、账号、后端或复杂数值。

美术要求：
- 03 Art 旧资产只作风格参考或收藏插图，不作为游戏主场景直接拼贴。
- 游戏内使用一套独立、完整、统一的生成美术，先小样审核再扩展。
- 游保持自然猫形态，不要直立、邮差包或过度拟人；玉玦像普通猫挂绳一样挂在颈间。
- 先读 Drive/biaoOS/domains/konglie/assets/AI_Art_Pipeline_Runtime.md，按既定命令、模型路径和专用凭证生成，不自行更换模型或 API Key，不批量付费出图。
- 不伪称 AI 输出为人工清稿或正式生产资产。

只允许写：
- app/art-reboot.html
- app/src/art-reboot/**
- app/public/assets/art-reboot/**
- app/vite.config.ts（仅用于登记独立 HTML 入口）
- tools/prepare_art_reboot_assets.py
- qa/art-reboot/**
- docs/ART_REBOOT.md

不要修改 App.tsx、App.css、game/content.ts、package.json、package-lock.json、其他关卡、地图和发布工作流。需要新增依赖时先停止并报告，不要自行安装。

交付要求：
- 每一步保持可构建、可玩，提供本地 URL，不接受只有生成图或文档。
- 运行 npm run build 和 npm run lint。
- 在真实浏览器验收桌面和 375px 触摸，记录控制台与 404，保存截图和报告。
- 只在自己的分支提交；不要 push、不要公开仓库、不要启用 Pages、不要合并。
- 最后报告实际改动文件、预览 URL、验证方式、未完成原因，等待集成负责人验收。
```

## Claude 的合适引入节点

- 当前：只读审查路线 DAG、关卡机制与验收用例，不让它写同一批 UI 文件。
- 美术方向选定后：可把独立的纯逻辑模块交给 Claude，例如行列消除算法、种子与路线性质测试；输入、输出和测试接口先冻结。
- 集成前：让 Claude 审查两个分支的差异和冲突，仍由同一个集成负责人写入与发布。
