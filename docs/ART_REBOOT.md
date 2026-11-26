# art-reboot-claude：痴单关卡全流程切片

> 当前版本完成“痴”的 0→1 垂直切片：漫画、短 CG、分支地图、痴关卡、复色地图、结尾与重开。其他四关只保留讨论，不实现、不生成美术，也没有可点击的假入口。

## 预览与边界

- 公开 playable：**https://biaowww.github.io/konglie-youdu-preview/**。独立静态预览仓库，电脑、服务器或 SSH 隧道重启都不影响入口。
- 源分支：`art-reboot-claude`。不合并、不替换公开 V1；预览仓库只包含构建后的静态文件。
- 流程：四格漫画 → 可跳过的短 CG → 首层 3 岔 → 次层 2 岔 → 同一个“痴” → 复色地图 → 两界交界 → 重开。
- 路线与结尾保存在当前浏览器的 `localStorage`（`youdu-slice-journey-v1`），刷新后恢复；无账号、后端或联网进度。
- 没有新增依赖，没有改 `package.json`、锁文件、`vite.config.ts`、旧 `App.tsx` 或 V1 发布配置。

## 资产

开发资产位于 `app/public/assets/art-reboot/fable/`；候选原图与元数据同步于 Drive `03 Art/AI生成资产/claude/`。

| 文件 | 来源 | 用途 |
|---|---|---|
| `c1-mountain.webp` | Fable 候选 `c1-mountain.png` | 第①格与 CG 参考 |
| `c2-window.webp` | Fable 候选 `c2-window.png` | 第②格 |
| `c3-jade.webp` | Fable 候选 `c3-jade.png` | 第③格与结尾 |
| `c4-scroll.webp` | Fable 候选 `05-opening.png` | 第④格、开始界面与分支地图 |
| `chi-outer.webp` | Opus 合成 `final-outer.png` | 痴表世界 |
| `chi-inner.webp` | Opus 合成 `final-inner.png` | 痴里世界 |
| `chi-complete.webp` | Opus 合成 `final-complete.png` | 痴局部复色 |
| `gua-arrival.mp4` | 一条 Seedance 首尾帧测试，4.04 秒、854×480、24fps、无音轨 | 入山短 CG |

痴的神像不使用生成图里的写实活猫。`qa/art-reboot/prepare_chi_assets.py` 只依赖 Pillow，复用 `03 Art` 原画的抽象对称猫神像，按神龛遮挡、各状态色板和米点尺度合成到三个同机位场景。原始美术不修改；放大检查图在 `qa/art-reboot/niche-*.png`。

## 实现

- `Opening.tsx`：四格不等画幅、各自局部有限动效、前进／后退／跳过、竖卷原地接入开始界面；保留既有的 86 项漫画验收。
- `ArrivalClip.tsx`：静音、自动播放失败时可手动播放、可跳过；尊重减少动态效果。
- `JourneyMap.tsx`：真实路径状态而非线性 `completed.length`。首层三选一、次层二选一，全部汇合到同一痴节点；未选路径关闭，已选路径与复色轨迹保留，完成后开放两界交界。分支只改变路线描述，不增加装备、战斗或其他四关。
- `ChiPlay.tsx` + `chi-play.css`：表世界 → 点神像 → 同机位里世界 → 拖动不规则纸色探灯 → 看清并点击三个“痴” → 墨点进入玉玦 → 三道刻痕逐亮 → 局部复色。包含相似干扰字、隐最多三次提示、蓝忿短暂干扰、44px 热区、键盘移动探灯与减少动态效果。竖排文字按列从右向左阅读；手机提高场景构图并保留玉玦可见区域。
- `SliceEnding.tsx`：玉玦与淡蓝紫点簇表现重新建立联系，不做其他四关或完整重逢演出。
- `ArtRebootApp.tsx`：串联漫画、CG、地图、痴、复色地图和结尾；重开清除路线。

## 验收

`node qa/art-reboot/verify.mjs` 使用真实 Chrome/CDP、真实鼠标与触摸事件；默认读 `GAME_URL`，否则自带静态服务读取 `app/dist`。

公开地址 **https://biaowww.github.io/konglie-youdu-preview/** 最近一次：**153/153 通过，控制台错误 0，失败资源 0**；`npm run build`、`npm run lint`、`git diff --check` 均通过。

覆盖：漫画 86 项；CG 时长与静音；首层 3 岔、次层 2 岔；路线与痴入口刷新恢复；痴桌面和 375px 完整交互；复色地图；结尾与重开；375px 触摸、热区、无横向溢出；控制台与失败资源。

关键证据位于 `qa/art-reboot/`：`comic-*.png`、`title.png`、`map.png`、`outer.png`、`inner.png`、`complete.png`、`map-restored.png`、`ending.png`、`mobile.png`、`chi-mobile.png`、`mobile-map.png`、`report.json`。

## 开发与成本约束

- Fable 负责美术导演方案和已有候选，不再重复分析整套资料。
- Opus 负责痴工程与神像合成；断点续写只读取当前组件，避免长上下文。
- Kimi Code 负责 CG、地图与结尾集成、公开发布、截图复核、测试和文档。
- 静态美术优先复用原画；只制作一条 CG。图片历史不重复传递，工程修改优先小范围补丁。

## 协作文档

Drive `02 GDD/协作修订/`：

- `空裂：游渡-主GDD-协作版.docx`
- `游渡-关卡流程和解密-协作版.docx`

AI 新增／修改使用黄色高亮，讨论使用 Word 原生批注。下一轮先读取用户更新后的协作版，再追加修改，不覆盖原始文件或用户迭代。

## 未完成与后续

- 嗔、慢、疑、贪的具体玩法和美术均未实现；后续沿用“观察—聚焦—辨认—吸收—复色”的认知循环逐项讨论，不直接视为定稿。
- 没有正式配乐或音效。
- 探灯的“点触散开”仍是视觉近似，复色采用同机位整图切换，不是逐点物理模拟。
- `WIN_YU_MOBILE` 特写框未启用；旧 `ChiReboot.tsx`、旧痴样式和旧 QA 脚本保留作历史参考，已无入口。
- Fable 的最终美术复核与原画师终审尚未执行；候选图不冒充人工清稿或最终生产美术。
