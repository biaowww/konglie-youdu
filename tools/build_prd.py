from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = Path('/Users/wvngbvao483/Library/CloudStorage/GoogleDrive-wvngbvao483@gmail.com/My Drive/元艺极客和超元/ProjectBreach/游戏共创Callab（x甜菜）/ai-playground/空裂：游渡-完整开发PRD+agentEdited.docx')
OUT.parent.mkdir(parents=True, exist_ok=True)
doc = Document()
sec = doc.sections[0]
sec.top_margin = sec.bottom_margin = Cm(1.55)
sec.left_margin = sec.right_margin = Cm(1.7)
sec.header_distance = sec.footer_distance = Cm(0.7)
style = doc.styles['Normal']
style.font.name = 'Times New Roman'; style.font.size = Pt(10)
style._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), '宋体')
style.paragraph_format.space_after = Pt(2); style.paragraph_format.line_spacing = 1.15


def run(p, text, size=10, bold=False, font='宋体', color=None):
    r = p.add_run(text); r.font.name = 'Times New Roman'; r.font.size = Pt(size); r.bold = bold
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), font)
    r.font.color.rgb = color or RGBColor(0x20, 0x20, 0x1E)
    return r


def title(text, subtitle):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run(p, text, 18, True, '黑体')
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(8)
    run(p, subtitle, 9.5, False, '楷体', RGBColor(0x66, 0x61, 0x5A))


def h(text):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(5); p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True; run(p, text, 11, True, '黑体')


def p(text):
    para = doc.add_paragraph(); para.paragraph_format.first_line_indent = Pt(20)
    run(para, text)


def b(text):
    para = doc.add_paragraph(); para.paragraph_format.left_indent = Pt(14); para.paragraph_format.first_line_indent = Pt(-10)
    run(para, '— ' + text, 9.7)


def br():
    para = doc.add_paragraph(); para.add_run().add_break(WD_BREAK.PAGE)


def footer():
    para = sec.footer.paragraphs[0]; para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = para.add_run(); begin = OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'), 'begin')
    instr = OxmlElement('w:instrText'); instr.set(qn('xml:space'), 'preserve'); instr.text = ' PAGE '
    end = OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'), 'end')
    for node in (begin, instr, end): r._r.append(node)
    r.font.size = Pt(8)
    header = sec.header.paragraphs[0]; header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run(header, '《空裂：游渡》完整开发 PRD', 8, False, '宋体', RGBColor(0x66, 0x61, 0x5A))


footer()
title('《空裂：游渡》完整开发 PRD', '公开可玩测试版｜v0.1｜2026-11-21')
h('1. 要解决的问题，以及为什么是现在')
p('「痴」单关原型已验证表里切换与探灯交互。最新主 GDD 和关卡流程要求把游戏推进为完整作品流程：统一名称为《空裂：游渡》，补齐出城、入山、五毒关卡、卡牌、地图复色与两界结局，并交付公开 URL 和可继续开发的仓库。')
p('本次目标不是再做一组互不相干的谜题，而是用同一套“观察—切换—解谜—玉佩反馈—复色攀登”循环，形成一条有起点、有终点、可实际通关的叙事短游戏。')
h('2. 成功标准')
b('玩家可从标题页连续完成出城漫画、入山、五关、至少一次卡牌展示机会、复色回放和两界结局；单局目标约 12–20 分钟。')
b('地图上的游使用指定头像 icon；隐在所有引导对话框中使用指定头像 icon，不再用全身图或占位圆。')
b('鼠标与单指触屏均可完成五关；没有必须依赖悬停、右键、精确拖拽或键盘的操作。')
b('每关恢复一部分色彩，地图路线只向上、不倒穿、不交叉；换序种子可复现，完成后能重玩新路线。')
b('静态构建可公开访问；GitHub 保存完整源码、资产管线和交接文档；浏览器无资源 404、无阻断性控制台错误。')
h('3. 本次包含')
b('品牌标题与开始界面、1–2 页出城定格漫画、入山滤镜过场、卦山地图与五关换序。')
b('嗔、痴、慢、疑、贪五个完整可玩关卡；隐引导、忿干扰、玉佩反馈、提示与重置。')
b('每关复色与已走路线回放；按种子概率掉落卡牌，卡牌翻面显示世界观短句；结局与重玩。')
b('本地进度保存、音量控制、原创程序音频氛围与交互音效、响应式布局、键盘可用性和减少动态效果支持。')
h('4. 明确不包含')
b('正式 Godot／Unity 工程、账号、联网存档、战斗系统、复杂道具栏、多语言、配音和商业化功能。')
b('人工最终清稿的 24 帧角色动画、正式录制配乐、最终 CG 动画，以及未在最新文档中确认的新主线设定。')

br()
h('5. 关卡实现方案')
p('以下“嗔、慢”属于本次补全方案；“疑、贪”按最新文档中的方向具体化。参数与台词可配置，后续试玩可替换而不改主流程。')
b('嗔｜聆听而非反击：忿抛出怒言与误导。玩家在动态字场中找到并吸收三个“听”，不与忿战斗；找对后听完其委屈，关卡结束。')
b('痴｜聚焦辨形：沿用已验证的探灯，在模糊、旋转、不同大小的字中寻找并吸收三个“痴”，蓝色忿短暂干扰。')
b('慢｜减速看微光：文字与微光持续流动，按住画面进入慢行状态，找到并吸收三个“慢”；松手恢复流速，不设倒计时。')
b('疑｜选择后不再反复：先选择“继续向上”或“停留听风”，再在碑林中消除“悔、退、改”三个动摇字，保留自己的选择。')
b('贪｜有限背包取舍：山果具有占用格数与回声价值，背包仅六格。玩家可拾取、放下，达到目标价值后提交；不是全接，也不因装满形成死局。')
h('6. 叙事、地图与奖励')
p('出城以不超过两页定格漫画交代游离开位面城、归乡寻找渡；入山通过表／里滤镜切换表现空裂后的失色。五关按种子换序，但地图路径始终向上。每关结束恢复约五分之一色彩，短暂回放已经走过的路线，并让黑色猫精灵若隐若现。')
p('卡牌按可配置概率掉落，使用现有卡框与隐藏物品美术，翻面展示短句。为便于测试，开发验收可通过固定种子复现掉落；不把概率值写成已定设计。')
p('结局只采用已确认内容：游与渡在两界交界一次次触碰，卦山逐步复色并重新建立联系；不额外解释“花儿”的一体多面。')
h('7. 美术、动画与音乐')
b('优先使用 03 Art 中的概念美术；原始文件只读。本地管线负责 PDF 栅格化、透明化、缩放、WebP 压缩、icon 裁切与资产清单。')
b('游、渡、忿、隐保持各自笔触与识别锚点。已有 24 帧测试动画可用于过场，但不得宣称完成人工生产清稿。')
b('补充必要的出城、地图或结局概念图；若生成结果无法保证路线和角色一致性，采用现有底图＋程序分层，不强行生图。')
b('音乐以 Web Audio 程序合成的风、低频 drone、五声音阶点缀和交互音效构成，无外部音乐版权依赖。正式作曲、演奏与配音列为能力缺口。')

br()
h('8. 技术方案与数据结构')
p('使用 React＋TypeScript＋Vite，DOM 负责场景与 UI，Canvas 负责文字、微光、探灯与粒子，Web Audio 负责声音。所有内容静态部署，无服务端、数据库或 SSR。进度与音量只存当前浏览器的 localStorage。')
b('GameState：当前阶段、剩余关卡、已走路线、复色比例、卡牌、种子、音量与是否完成。')
b('LevelConfig：场景、角色色、目标、干扰池、教学台词、提示、目标数量、掉落率与难度参数。')
b('统一输入层：Pointer Events、拖动阈值、pointercancel、多指忽略、坐标缩放、键盘替代。')
b('统一表现层：表里切换、玉佩吸收、复色、路线回放、卡牌翻面、隐与忿的 icon 对话层。')
h('9. 约束与边界情况')
b('触屏拖动不滚动页面；目标不被 HUD 永久遮挡；切后台后暂停计时和音频；刷新后可从已完成节点继续。')
b('低性能设备减少粒子；减少动态效果时保留可读反馈；图片加载失败显示可玩的降级场景而不是空白。')
b('素材只做本地副本，不改原图；第三方依赖记录许可证；私密或未授权材料不进入公开仓库。')
h('10. 粗排期')
b('第一阶段：PRD、资产盘点与处理管线、完整状态机、地图和统一对话层。')
b('第二阶段：五关垂直切片、卡牌与结局、音乐、补充美术与动画。')
b('第三阶段：桌面与触屏全流程验收、性能与冷启动检查、公开 URL、GitHub 与交接文档。')
h('11. 已知能力缺口与移交重点')
b('Godot 当前不可用，本次以 Web 完整版本交付；后续若迁移，优先复用关卡配置、资产和状态流，不照搬 DOM 结构。')
b('最终角色动画清稿、正式配乐与配音、最终 CG、部分场景表里配对仍需美术／音频制作。')
b('嗔、慢的补全玩法、卡牌掉率、贪的数值和部分台词为待试玩参数；后续开发者应先收反馈再定稿。')
b('GitHub 凭据若失效，只能先完成本地仓库和提交，公开推送需要重新授权；不得伪称已上传。')
h('12. 本次验收输出')
b('公开可玩 URL、GitHub 仓库、完整源代码与本地资产包、构建与运行说明、全流程验收记录、能力与资产缺口清单、后续开发交接文档。')
doc.save(OUT)
print(OUT)
