from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = Path('/Users/wvngbvao483/Library/CloudStorage/GoogleDrive-wvngbvao483@gmail.com/My Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/ai-playground/空裂：游渡-开发交接与验收报告+agentEdited.docx')
doc = Document()
sec = doc.sections[0]
sec.top_margin = sec.bottom_margin = Cm(1.55)
sec.left_margin = sec.right_margin = Cm(1.7)
sec.header_distance = sec.footer_distance = Cm(0.7)
style = doc.styles['Normal']; style.font.name = 'Times New Roman'; style.font.size = Pt(10)
style._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), '宋体')
style.paragraph_format.space_after = Pt(2); style.paragraph_format.line_spacing = 1.16


def run(p, text, size=10, bold=False, font='宋体', color=None):
    r = p.add_run(text); r.font.name = 'Times New Roman'; r.font.size = Pt(size); r.bold = bold
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), font)
    r.font.color.rgb = color or RGBColor(0x20, 0x20, 0x1E)


def h(text):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(5); p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True; run(p, text, 11, True, '黑体')


def p(text, indent=True):
    para = doc.add_paragraph()
    if indent: para.paragraph_format.first_line_indent = Pt(20)
    run(para, text)


def b(text):
    para = doc.add_paragraph(); para.paragraph_format.left_indent = Pt(14); para.paragraph_format.first_line_indent = Pt(-10)
    run(para, '— ' + text, 9.7)


para = doc.add_paragraph(); para.alignment = WD_ALIGN_PARAGRAPH.CENTER
run(para, '《空裂：游渡》开发交接与验收报告', 18, True, '黑体')
para = doc.add_paragraph(); para.alignment = WD_ALIGN_PARAGRAPH.CENTER
run(para, '完整 Web 可玩测试版｜2026-11-21', 9.5, False, '楷体', RGBColor(0x66, 0x61, 0x5A))
header = sec.header.paragraphs[0]; header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
run(header, '《空裂：游渡》开发交接与验收报告', 8, False, '宋体', RGBColor(0x66, 0x61, 0x5A))
footer = sec.footer.paragraphs[0]; footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = footer.add_run(); begin = OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'), 'begin')
instr = OxmlElement('w:instrText'); instr.set(qn('xml:space'), 'preserve'); instr.text = ' PAGE '
end = OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'), 'end')
for node in (begin, instr, end): r._r.append(node)
r.font.size = Pt(8)

h('1. 交付入口')
p('公开试玩：https://konglie-youdu.ok.kimi.link')
p('GitHub 私有仓库：https://github.com/biaowww/konglie-youdu')
p('本地工程：/Users/wvngbvao483/offcircle_dev/konglie-youdu')
p('公开发布版本：1a1fea7b-28d2-8706-8000-0000b7f2985a。发布策略为 public，类型为纯静态前端，无后端、账号或数据库。')
h('2. 已完成内容')
b('游戏名称统一为《空裂：游渡》；出城两页漫画、入山过场、五关换序地图、五关、卡牌、复色回放与两界结局完整连通。')
b('地图上的游使用指定头像 icon；隐的引导对话框统一使用指定头像 icon。')
b('嗔：找三个“听”；痴：探灯找三个“痴”；慢：按住减速找三个“慢”；疑：选路后消除“悔、退、改”；贪：六格背包取舍并达到目标回声。')
b('每关复色并回放已走路线；卡牌按可复现种子概率掉落，支持翻面与卡册；结局通过三次触碰逐步恢复色彩。')
b('本地进度与音量保存；程序生成风声、drone、五声音阶点缀与交互音效；支持鼠标、触屏和基础键盘。')
h('3. 工程结构')
p('React＋TypeScript＋Vite。App 管理标题、漫画、地图、关卡、卡牌、结局和 localStorage；LevelShell 管理 outer → transition → inner → complete；三个谜题组件分别承载聚焦／减速、辨义消除和背包取舍。')
p('tools/prepare_assets.py 只读原始美术，输出 WebP、透明图和来源清单。tools/qa_game.mjs 完成桌面真实通关；tools/qa_mobile.mjs 完成 375px 移动布局与真实触摸事件验收。')
p('仓库内 README、AGENTS、docs/HANDOFF、ASSETS、QA、PUBLISHING 和 CREDITS 提供后续开发所需说明。')

para = doc.add_paragraph(); para.add_run().add_break(WD_BREAK.PAGE)
h('4. 验收结果')
b('生产构建与全工程 ESLint 均通过。')
b('桌面公开 URL 全流程：五关均能从表世界进入里世界并结束；贪达到目标回声；卡牌可翻面；五关后三次触碰进入最终结局。')
b('移动端：无横向溢出；触摸拖动不误收集；触摸点选有效；页面不随解谜滚动；贪背包完整位于屏幕内。')
b('控制台错误 0，失败资源 0；验收环境下痴约 60 fps、慢约 60 fps。')
b('匿名公开 HTML 标题正确；线上脚本与本地最终构建 SHA-256 完全一致。')
h('5. 设计边界：后续开发者不要误判')
b('嗔、慢为本次补全方案；疑、贪是按最新方向具体化。卡牌掉率、贪的数值、忿节奏和部分台词均为待试玩参数，不是最终定稿。')
b('本次没有 Godot 工程。Web 资产、关卡配置和状态机可迁移，DOM 与 Canvas 表现层需要按目标引擎重写。')
b('24 帧行走和部分角色图为 AI 辅助测试资产，不是人工最终清稿；部分场景仍是概念拼贴。')
b('程序音频是氛围测试音轨，不是正式录制配乐；没有配音或最终 CG 动画。')
h('6. 推荐下一步')
b('先让团队完整试玩，记录每关完成时长、误点、提示、重置与放弃位置，再收敛嗔、慢和贪，不急着增加第六种机制。')
b('美术优先处理：结局渡、地图路线、场景表里配对、行走清稿与最终 CG；音频随后替换正式配乐与环境音。')
b('若转 Godot，保留 content 配置、种子、资产与状态流，用 Node2D／Control、CanvasItem Shader、SpriteFrames 和 InputEvent 重写表现层。')
b('每次修改至少跑 npm run build 与 lint；影响流程时必须重跑桌面全流程和移动端验收，并更新 QA 与 PUBLISHING。')
h('7. 重要文件指引')
b('完整开发 PRD：ai-playground/空裂：游渡-完整开发PRD+agentEdited.docx。')
b('开发交接：仓库 docs/HANDOFF.md；资产说明：docs/ASSETS.md；验收：docs/QA.md；公开部署：docs/PUBLISHING.md。')
b('本地资产包：app/public/assets/；全部原始美术仍在 Drive 03 Art，未被修改。')
doc.save(OUT)
print(OUT)
