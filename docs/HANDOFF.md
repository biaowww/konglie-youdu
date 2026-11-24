# 《空裂：游渡》开发交接说明

## art-reboot-kimi 当前主线

独立统一美术与痴可玩切片位于 `app/art-reboot.html` 和 `app/src/art-reboot/`。四格漫画、开始界面、神像切换、灯海、忿与 375px 触摸均已验收。完整说明见 `docs/ART_REBOOT.md`，并行写入边界见 `docs/ART_REBOOT_COLLABORATION.md`。

## 1. 本次交付的真实状态

这是一个完整可玩的 Web 测试版，不是单关演示，也不是 Godot 工程。玩家可以从标题连续走到最终结局，五关均有真实输入、成功判定和回地图流程。

已实现：出城、入山、换序地图、五关、概率卡牌、复色回放、三次触碰结局、进度保存、音量控制和程序音频。

V1 已将出城升级为三镜旅行测试版，并完成原画透明 sprite 与卡牌框分层。尚未完成多路线 DAG、疑／贪／嗔／慢的新机制、忿的完整伏笔和主人—猫重逢；这些仍是下一阶段 P0，不应把当前完整流程当作新需求全部完成。

## 2. 设计优先级

1. `02 GDD/空裂：游渡-主GDD.docx`
2. `02 GDD/游渡-关卡流程和解密.docx`
3. `ai-playground/空裂：游渡-完整开发PRD+agentEdited.docx`
4. 本仓库实现与 `docs/`

不要拿旧《心音渡》命名或固定关卡顺序覆盖上述文件。

### 已确认

- 游寻找渡、表里世界、猫神像短时切换、玉佩感应、五毒换序、每关复色、路线回放和两界触碰结局。
- 地图上的游用头像 icon；隐用对话框头像 icon。
- 痴采用探灯找三个“痴”；疑以消除误导为核心；贪围绕背包取舍。

### 本次补全／待试玩

- 嗔：找三个“听”，不反击，听完忿的委屈。
- 慢：按住减速，找三个“慢”。
- 疑：先选路，再消除“悔、退、改”。
- 贪：六格背包，回声达到 12；山果可拾取和放下。
- 卡牌：以 45% 的种子概率掉落；这是可调参数。
- 台词、提示时机、忿出现节奏、具体数值均为待试玩内容。

## 3. 技术结构

- `app/src/App.tsx`：标题、出城、入山、地图、关卡、卡牌、结局和存档。
- `app/src/components/JourneyPrologue.tsx`：城门、地图、卦山三镜；以 24fps 驱动角色位移、镜头和复色，支持跳过与减少动态效果。
- `app/src/components/LevelShell.tsx`：outer → transition → inner → complete 统一关卡状态机。
- `app/src/components/MapScreen.tsx`：上行节点、换序、游头像、复色与回放。
- `app/src/components/Ending.tsx`：三次触碰与角色靠近。
- `app/src/game/content.ts`：五关配置、卡牌、文案、种子换序与掉落。
- `app/src/game/puzzles/FocusPuzzle.tsx`：痴的聚焦、慢的按住减速，统一鼠标／触摸／键盘。
- `app/src/game/puzzles/WordPuzzle.tsx`：嗔的聆听与疑的选择后消除。
- `app/src/game/puzzles/GreedPuzzle.tsx`：贪的掉落、背包与提交。
- `app/src/game/audio.ts`：Web Audio 风声、drone、五声音阶点缀与交互音效。
- `app/src/App.css`：全部场景、地图、卡牌和响应式样式。

## 4. 存档和随机

`localStorage` key：`youdu-save-v1`。保存 seed、order、completed、cards、volume。不保存关卡中途状态；继续游戏从地图或已完成的结局进入。

`shuffleLevels(seed)` 只换五关顺序，节点位置不换，因此路线永远向上。`rollCard(seed, level, completedCount)` 可复现，便于测试。修改随机逻辑必须保留可复现性。

## 5. 美术管线

```bash
YOUDU_DRIVE_ROOT="/path/to/元艺极客和超元" python3 tools/prepare_assets.py
```

脚本只读 Drive 原图，生成 WebP、透明图、缩放图和本机 `app/art-manifest.json`。源文件路径、输出尺寸与字节数均可追溯；清单不公开。

疑使用单幅碑林并填平透明边界；渡仅通过边缘 flood fill 去背景，避免误伤浅蓝本体。不要简单全局去白色。

## 6. 音频

音频全部实时合成，无音频文件、无远程服务。浏览器要求用户手势后启动，开始按钮与音量按钮都调用 `audio.start()`。

这是氛围测试音轨，不是正式作曲。后续若替换为音频文件，保留音量、静音、切换与吸收事件的接口即可。

## 7. 验收

```bash
cd app
npm run build
npm run lint
npm run preview -- --host 127.0.0.1 --port 7101
GAME_URL="http://127.0.0.1:7101/" node ../tools/qa_game.mjs
node ../tools/qa_mobile.mjs
```

- `tools/qa_game.mjs` 用真实 Chrome/CDP 完成五关、卡牌翻面和结局，记录控制台与网络。
- `tools/qa_mobile.mjs` 使用真实触摸事件，检查拖动、点选、滚动和背包布局。
- 报告与截图在 `qa/`。不要只凭 build 成功宣称可玩。

## 8. 能力与内容缺口

- Godot 4.7.2 与匹配导出模板已安装，最小项目已实际完成 Web 导出并在浏览器启动；正式 Godot 工程仍未建立，当前交付是 Web 版本。
- 24 帧行走为 AI 辅助测试资产，需人工修正耳缺、爪部、包带和帧间一致性。
- 部分场景只有概念拼贴，表里配对并非最终生产分层。
- 无正式录制配乐、配音、最终 CG 动画。
- 嗔、慢的新机制、贪的数值、卡牌掉率需用户试玩后收敛。

## 9. 推荐下一步

1. 先完成 4 层＋山顶的多路线地图和真实地点对齐，每局 3 个主题关卡＋1 个轻事件。
2. 疑改为 4×5 行列滑动三连消除；贪补足落物节奏与六格取舍；嗔、慢脱离点字。
3. 串联主人—猫关系、忿的两次前期伏笔和重逢画面；不做长篇设定说明。
4. 等你或原画师审核 V1 小样后再扩展美术，优先修正左耳缺口、帧间结构和角色多角度。
5. 若转 Godot，复用 `content.ts` 的配置、种子、资产和状态流，用 Node2D／Control、CanvasItem Shader、SpriteFrames 和 InputEvent 重写表现层，不要逐行翻译 DOM。
6. 保留桌面全流程与移动端验收作为每次修改的回归门槛。
