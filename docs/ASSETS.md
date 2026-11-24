# 美术与音频资产说明

## 来源

- 主资产：`03 Art/主要资产表.xlsx` 与 `03 Art/` 下的概念美术。
- 游的多角度、背影、玉佩与 24 帧测试动画：此前 `_prototype/01_character_art/` 的 AI 辅助测试包。
- 位面城与空裂大世界参考：资产表指向的 `ProjectBreach/美术Art/世界和场景美术/`。
- 所有原始文件只读，未被修改。

## 生成方式

`tools/prepare_assets.py` 将原图复制处理为 `app/public/assets/`。运行前将 `YOUDU_DRIVE_ROOT` 指向本机的 `元艺极客和超元` 目录，避免在公开仓库写入个人绝对路径：

- 场景最大边 1920px，地图 2200px，头像与道具按用途缩小。
- 默认 WebP quality 84；GIF 仅保留作动画预览。
- 疑场景使用单幅碑林并填平透明拼贴边界。
- 渡使用边缘 flood fill 去背景，保留浅蓝灵猫本体。
- `app/art-manifest.json` 记录源路径、原始尺寸、输出尺寸与字节数；仅保留在本机，已加入 `.gitignore`，不进入公开仓库或发布包。

## 关键资源

- `you-icon.webp`：地图上的游头像，来自 `游/游-onthemap.png`。
- `yin-icon.webp`：隐对话头像，来自 `隐-引导npc/隐-对话框形象.png`。
- `du.webp`：结局渡的透明测试图。
- `statue.webp`、`jade.webp`：神像与玉佩反馈。
- `card-*.webp`：卡牌画面；`card-frame.webp` 为卡框。

## 音频

无外部音频文件。`src/game/audio.ts` 实时生成风、低频 drone、五声音阶点缀与点击／切换／吸收／完成／卡牌音效，避免外部音乐授权依赖。

## 缺口

- 部分场景为概念拼贴，不是最终生产分层。
- 表里场景配对、地图细节、结局 CG 和角色动画仍需人工制作或清稿。
- 正式配乐、配音与环境音录制未完成。
- 游与渡的更多表情、忿的完整多色／多物种变体未全部制作。

## V1 测试资产

- `you-walk-alpha.webp`：24 帧 AI 辅助行走测试序列，已去除纸底；包与玉玦跟随来自原帧，尚未人工清稿。
- `fen-red.webp`、`fen-green.webp`：从原画提取的透明测试 sprite，保留彩色粉笔毛发，不是新生成或人工清稿。
- `card-frame.webp`：原卡牌框转为浅色透明蒙版，卡面、文字与遮罩继续使用独立层。
- 游 GPT Image 小样只用于风格对照，左耳缺口仍需修正，未作为定稿接入。忿的在线生成请求超时，未产生候选图，也未重复扣费重试。
- 对照图：`qa/v1/you-style-review.png`、`qa/v1/fen-on-dark.png`。
