# 空裂：游渡 · Web App

完整运行与交接说明见仓库根目录 `README.md` 和 `docs/HANDOFF.md`。

```bash
npm install
npm run dev -- --host localhost --port 7100 --strictPort
npm run build
npm run lint
npm run preview -- --host 127.0.0.1 --port 7101
```

- `src/App.tsx`：完整游戏状态与存档。
- `src/components/`：地图、统一关卡壳、对话、结局。
- `src/game/`：关卡配置、五关玩法、随机与音频。
- `public/assets/`：由 `../tools/prepare_assets.py` 生成的本地美术副本。

本项目为纯静态前端；进度与音量仅存当前浏览器。
