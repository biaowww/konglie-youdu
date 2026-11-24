# 空裂：游渡 · 本地开发规则

## 关联位置速查

- 主 GDD：`Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/02 GDD/空裂：游渡-主GDD.docx`
- 关卡流程：`Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/02 GDD/游渡-关卡流程和解密.docx`
- 美术：`Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/03 Art/`
- 开发 PRD：`Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/ai-playground/空裂：游渡-完整开发PRD+agentEdited.docx`
- 本地仓库：`konglie-youdu/`
- GitHub：`https://github.com/biaowww/konglie-youdu`
- 公开试玩：见 `docs/PUBLISHING.md`

## 必须遵守

1. 修改设计前先读最新主 GDD 与关卡流程；不要用旧《心音渡》文档覆盖新名称与新流程。
2. 游戏统一名称为《空裂：游渡》。地图上的游和对话框里的隐必须使用指定头像资源，不能换用通用猫图标。
3. 嗔、慢为本次补全方案；疑、贪按最新文档具体化。改这些机制前先确认它们已试玩，而不是当定稿直接扩写。
4. 原始美术只读。所有压缩、透明化、裁切通过 `tools/prepare_assets.py` 生成到 `app/public/assets/`，不要修改 Drive 原图。运行前用 `YOUDU_DRIVE_ROOT` 指定本机资料根，来源清单仅写入已忽略公开的 `app/art-manifest.json`。
5. 代码与构建产物只留本地仓库和 GitHub，不放回 Drive；开发草稿与面向人的报告放 `ai-playground`。
6. 不增加账号、后端、战斗、复杂道具栏或未经确认的主线。进度仅存当前浏览器。
7. 每次修改至少跑 `npm run build` 和 `npm run lint`；影响流程时必须重跑桌面全流程与移动端验收。
8. 不伪称生成图是人工清稿，不伪称程序音乐是正式配乐，不伪称 Web 版本是 Godot 工程。
9. 公开部署后更新 `docs/PUBLISHING.md`；验收结果更新 `docs/QA.md`。
