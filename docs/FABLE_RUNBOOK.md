# Fable 授权与 0→1 验收操作手册

## 结果在哪里看

1. **代码与提交**：`https://github.com/biaowww/konglie-youdu/tree/art-reboot-claude`。当前只有交接材料，Fable 的开发结果以新提交为准。
2. **本地／服务器 playable**：Fable 应提供 `art-reboot.html` 的预览地址、端口、截图和提交 hash。不要只接受图片或文档。
3. **美术小样**：G Drive `03 Art/AI生成资产/claude/`，先审小样，再允许批量生成。
4. **公开 URL**：当前仍是旧 V1，Fable 尚未通过前不要替换。验收通过后再单独配置预览发布。

## 让 Fable 先做什么

把下面这段发给它：

```text
先不要开发。先做环境自检并逐项给证据：
1. 用 G Drive MCP 读取 03 Art 的一张原图，并在 03 Art/AI生成资产/claude/ 创建环境检查文件；不得修改原图。
2. 用 OpenRouter 调用 anthropic/claude-fable-5.2，返回 FABLE_5_2_OK；再用 openai/gpt-image-2.6-sunburst 生成一张小墨点测试图。
3. 报告 node、npm、python、Pillow、GitHub 权限和 Chrome 路径。
4. 运行 npm ci、npm run build、npm run lint。
5. 在任何开发前给出：检查结果、失败项、你的 art-reboot-claude 分支提交 hash。不要先批量生成素材。
```

## 如果 G Drive MCP 未授权

不要新增第二套 Key 或借用其他 session。先在 sgp-dev 用现有 MCP 的配置方式重新登录；如果决定改用 rclone：

```bash
rclone config
```

- 新建 remote，命名 `sgp-gdrive`，类型选 `drive`，权限选可读写。
- 选无浏览器／headless 模式，终端会显示授权 URL。
- 在自己的 Mac／Windows 浏览器打开 URL，登录 Google 并允许，随后把验证码粘回 sgp-dev 终端。
- 无浏览器授权也支持官方参数：`rclone authorize drive --auth-no-open-browser`，见 https://rclone.org/commands/rclone_authorize/。

验证：

```bash
rclone ls sgp-gdrive:
```

只下载参考原图到工作区，输出只上传 `AI生成资产/claude/`。不要同步或覆盖原始 `03 Art`。

## 配置 OpenRouter

在本地浏览器打开 `https://openrouter.ai/keys` 创建专用 Key，不要发到聊天或写进 Git。

在 sgp-dev 终端执行：

```bash
read -s OPENROUTER_API_KEY
export OPENROUTER_API_KEY
```

粘贴 Key 后回车，终端不会回显。建议只放在当前会话或权限为 0600 的服务器配置中，退出会话时 `unset OPENROUTER_API_KEY`。

验证 Fable 文本调用：

```bash
curl --http1.1 --fail-with-body --silent --show-error \
  https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-fable-5.2","messages":[{"role":"user","content":"只回复 FABLE_5_2_OK"}],"max_tokens":100}'
```

验证图像调用（会产生小额费用）：

```bash
curl --http1.1 --fail-with-body --silent --show-error \
  https://openrouter.ai/api/v1/images \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-image-2.6-sunburst","prompt":"one small irregular black ink dot on rice paper, no text","quality":"low","aspect_ratio":"1:1","response_format":"url"}'
```

## 配置 GitHub 推送

最简单的是在 sgp-dev 执行：

```bash
gh auth login -h github.com
```

选择 HTTPS 和浏览器登录，终端会给出 URL 与一次性 code。在自己的 Mac／Windows 打开 `https://github.com/login/device`，输入 code 并授权，然后：

```bash
gh auth status
git push -u origin art-reboot-claude
```

不要把 GitHub token 写进聊天、脚本或 Git。

## 验证 Node、Python 和浏览器

```bash
node -v
npm -v
python3 --version
python3 -c 'import PIL; print(PIL.__version__)'
which chromium chromium-browser google-chrome || true
```

建议 Node 22 LTS。Chrome 路径现在可用环境变量指定：

```bash
export CHROME_PATH=/path/to/chromium
```

运行：

```bash
npm ci
npm run build
npm run lint
GAME_URL="http://127.0.0.1:7106/art-reboot.html" node tools/qa_art_reboot.mjs
```

## 从自己的 Mac／Windows 看服务器 playable

让 Fable 在 sgp-dev 启动：

```bash
npm run preview -- --host 127.0.0.1 --port 7106 --strictPort
```

在自己的电脑执行（替换为实际 SSH 别名）：

```bash
ssh -N -L 7106:127.0.0.1:7106 <你的 sgp-dev SSH 别名>
```

保持该终端开启，然后在本机浏览器打开：

```text
http://127.0.0.1:7106/art-reboot.html
```

如果 Fable 使用其他端口，将两端端口号一起替换。不要默认开放服务器公网端口，优先 SSH 隧道。

## 0→1 验收门槛

1. **环境**：MCP、OpenRouter、Node、Python、Chrome、GitHub 均有证据，不是口头“应该可以”。
2. **方案**：先有一页美术导演与四格分镜，先审核再生成。
3. **小样**：角色、神像、玉玦、UI、煤油灯与场景小样通过，禁止 sticker、悬浮饰物和风格割裂。
4. **Playable**：漫画→开始界面→痴场景可以实际操作，不只是图片轮播。
5. **引导**：玩家明白为什么找三个痴、如何操作、找齐后发生什么。
6. **工程**：build、lint、桌面与 375px 验收通过，控制台错误与失败资源为 0。
7. **交付**：提供分支、提交 hash、预览地址、截图、未完成原因。只有验收通过后才谈合并和公开链接。
