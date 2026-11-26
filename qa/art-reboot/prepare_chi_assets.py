#!/usr/bin/env python3
"""把原画抽象对称猫神像（statue.jpg）合成进痴的三张场景，替换生成图里过于写实的活猫像。
只依赖 Pillow（不新增依赖）。

做法（不是贴纸）：
1. 龛口内用龛内自身的暗色竖向米点重新铺底，抹掉生成的猫；龛柱、龛楣仍是原图；
2. 把 statue.jpg 按与蓝灰底的色差抠成“点”的透明度——只取点不取底，保留原画笔触；
3. 按状态调色：表=褪成蓝灰；里=更冷更暗；复色=保留原画多色米点；
4. 底边对齐供台基线；供台前沿与龛柱压回前景（遮挡）；外缘补洒同款墨点；整片乘纸纹。
原始文件不改，只写 final-*.png；另写 qa/art-reboot/niche-*.png 放大检查图。
"""
from pathlib import Path
import random
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageStat

BASE = Path('/home/ubuntu/offcircle_dev')
SRC = BASE / 'art-candidates/fable-slice'
STATUE = BASE / 'reference/art-preview/statue.jpg'
QA = Path(__file__).resolve().parent

# 画幅比例；三张同机位
NICHE = (0.178, 0.475, 0.276, 0.722)   # 龛内暗处（抹除区）
FIGURE = (0.186, 0.486, 0.268, 0.712)  # 神像外框，底边 = 供台基线
# 原画 statue 的米点色（墨、灰、橄榄、杏、黄、钴蓝、紫），表/里为其褪色版本
PALETTE = {
    'complete': [(46, 44, 50), (150, 152, 158), (140, 146, 92), (226, 160, 110), (228, 200, 96), (70, 98, 170), (128, 100, 150), (210, 212, 214)],
    'outer': [(70, 74, 84), (150, 156, 166), (176, 182, 190), (196, 200, 206), (128, 136, 150)],
    'inner': [(52, 58, 74), (112, 122, 146), (146, 156, 178), (170, 178, 196), (88, 98, 124)],
}
JOBS = [('s1-outer.png', 'final-outer.png', 'outer'),
        ('s2-inner.png', 'final-inner.png', 'inner'),
        ('s3-complete.png', 'final-complete.png', 'complete')]


def statue_dots():
    im = Image.open(STATUE).convert('RGB')
    w, h = im.size
    strips = [im.crop((0, 0, w, 10)), im.crop((0, h - 10, w, h)), im.crop((0, 0, 10, h)), im.crop((w - 10, 0, w, h))]
    meds = [ImageStat.Stat(s).median for s in strips]
    bg = tuple(sorted(m[c] for m in meds)[len(meds) // 2] for c in range(3))
    diff = ImageChops.difference(im, Image.new('RGB', im.size, bg)).convert('L')
    # 原画的蓝灰底本身也是点：单像素色差分不出主体，改用局部墨密度得剪影
    dens = diff.resize((w // 8, h // 8), Image.BOX).filter(ImageFilter.GaussianBlur(3))
    vals = sorted(dens.get_flattened_data() if hasattr(dens, 'get_flattened_data') else dens.getdata())
    lo, hi = vals[int(len(vals) * .55)], vals[int(len(vals) * .85)]
    mask = dens.point(lambda v: max(0, min(255, int((v - lo) * 255 / max(1, hi - lo))))).resize((w, h), Image.BILINEAR)
    mask = ImageChops.multiply(mask, ImageChops.lighter(mask, ImageChops.lighter(mask.transpose(Image.FLIP_LEFT_RIGHT), mask)))
    mask = ImageChops.lighter(mask, mask.transpose(Image.FLIP_LEFT_RIGHT))  # 强制对称
    box = mask.point(lambda v: 255 if v > 120 else 0).getbbox() or (0, 0, w, h)
    return im.crop(box), mask.crop(box), bg


def grade(rgb, state):
    if state == 'outer':
        g = ImageEnhance.Color(rgb).enhance(0.22)
        return ImageChops.multiply(g, Image.new('RGB', g.size, (232, 240, 255)))
    if state == 'inner':
        g = ImageEnhance.Color(rgb).enhance(0.15)
        g = ImageChops.multiply(g, Image.new('RGB', g.size, (190, 204, 236)))
        return g
    return ImageEnhance.Color(rgb).enhance(2.2)


def rice(d, cx, cy, l, t, fill):
    d.ellipse([cx - t / 2, cy - l / 2, cx + t / 2, cy + l / 2], fill=fill)


def fill_niche(img, nb, rng):
    region = img.crop(nb)
    w, h = region.size
    L = region.convert('L')
    hist = sorted(L.get_flattened_data() if hasattr(L, 'get_flattened_data') else L.getdata())
    p35, p70 = hist[int(len(hist) * .35)], hist[int(len(hist) * .7)]
    dark = ImageStat.Stat(region, L.point(lambda v: 255 if v <= p35 else 0)).mean
    mid = ImageStat.Stat(region, L.point(lambda v: 255 if p35 < v <= p70 else 0)).mean
    # 原画神像画在中明度蓝灰底上：龛内底色提到这一明度，四周再用暗点收边成“龛”
    tone = tuple(int(dark[c] * .7 + mid[c] * .3) for c in range(3))
    canvas = Image.new('RGB', (w, h), tone)
    d = ImageDraw.Draw(canvas, 'RGBA')
    for _ in range(int(w * h / 16)):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        rim = min(x, w - x, y) / (w * .5)
        c = dark if rng.random() < .75 - rim else (mid if rng.random() < .6 else tone)
        col = tuple(max(0, min(255, int(v * rng.uniform(.88, 1.1)))) for v in c) + (int(rng.uniform(60, 140)),)
        l = rng.uniform(4, 9)
        rice(d, x, y, l, l / rng.uniform(2, 3), col)
    for _ in range(0):
        col = tuple(max(0, min(255, int(v * rng.uniform(.85, 1.12)))) for v in c) + (int(rng.uniform(70, 150)),)
        l = rng.uniform(4, 9)
        rice(d, rng.uniform(0, w), rng.uniform(0, h), l, l / rng.uniform(2, 3), col)
    canvas = canvas.filter(ImageFilter.GaussianBlur(.6))
    feather = Image.new('L', (w, h), 0)
    ImageDraw.Draw(feather).rectangle([10, 10, w - 11, h - 11], fill=255)
    feather = feather.filter(ImageFilter.GaussianBlur(7))
    keep_light = L.point(lambda v: 255 - max(0, min(255, int((v - 200) * 255 / 30))))
    mask = ImageChops.multiply(feather, keep_light)
    img.paste(Image.composite(canvas, region, mask), nb[:2])


def compose(src, dst, state, srgb, salpha, seed):
    rng = random.Random(seed)
    orig = Image.open(SRC / src).convert('RGB')
    W, H = orig.size
    img = orig.copy()
    nb = (int(NICHE[0] * W), int(NICHE[1] * H), int(NICHE[2] * W), int(NICHE[3] * H))
    fill_niche(img, nb, rng)

    fx0, fy0, fx1, fy1 = int(FIGURE[0] * W), int(FIGURE[1] * H), int(FIGURE[2] * W), int(FIGURE[3] * H)
    k = min((fx1 - fx0) / srgb.width, (fy1 - fy0) / srgb.height)
    tw, th = max(1, int(srgb.width * k)), max(1, int(srgb.height * k))
    rgb = grade(srgb, state).resize((tw, th), Image.LANCZOS)
    a = salpha.resize((tw, th), Image.LANCZOS).point(lambda v: int(v * (.84 if state != 'complete' else .93)))
    # 同一盏灯在龛前下方：神像下半略受暖光
    warm = Image.linear_gradient('L').resize((tw, th))
    tint = (255, 238, 214) if state != 'inner' else (250, 244, 236)
    rgb = Image.composite(ImageChops.multiply(rgb, Image.new('RGB', (tw, th), tint)), rgb, warm.point(lambda v: v // 2))
    ox, oy = fx0 + (fx1 - fx0 - tw) // 2, fy1 - th
    # 原画淡淡垫底一层（保留它的点阵结构），再按场景米点尺度逐点重绘：
    # 颜色/浓度取自原画同位置，左半边落点后镜像到右半边，保证全场唯一的对称。
    img.paste(rgb, (ox, oy), a.point(lambda v: v // 3))
    dots = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dots)
    small_a = a.filter(ImageFilter.GaussianBlur(2))
    small_c = rgb.filter(ImageFilter.GaussianBlur(1.5))
    cx = tw / 2
    y = 1.0
    while y < th - 1:
        rel = y / th                       # 头部最小最密，向下渐大渐疏
        step = 2.6 + rel * 3.2
        x = cx
        while x > 1:
            jx, jy = x + rng.uniform(-1, 1), y + rng.uniform(-1, 1)
            av = small_a.getpixel((int(jx), int(min(th - 1, jy))))
            if av > 40 and rng.random() < av / 255 + .25:
                col = small_c.getpixel((int(jx), int(min(th - 1, jy))))
                # 暗龛里的神像：点比龛底亮，按状态取淡蓝灰/冷灰/原画多色
                col = rng.choice(PALETTE[state])
                col = tuple(max(0, min(255, int(v * rng.uniform(.9, 1.08)))) for v in col)
                l = 3.4 + rel * 5 + rng.uniform(0, 1.8)
                fill = col + (int(min(235, 110 + av * .6)),)
                rice(dd, jx, jy, l, l / rng.uniform(2, 2.8), fill)
                rice(dd, 2 * cx - jx, jy, l, l / rng.uniform(2, 2.8), fill)
            x -= step * rng.uniform(.8, 1.2)
        y += step * .8
    # 头部：最小最密的一簇（双耳两尖），对称
    hy = th * .2
    for _ in range(140):
        r = rng.uniform(0, tw * .17); ang = rng.uniform(0, 3.1416)
        import math
        px, py = cx + math.cos(ang) * r * .5, hy + math.sin(ang) * r * .5 - r * .25
        col = small_c.getpixel((int(min(tw - 1, px)), int(max(0, min(th - 1, py)))))
        fill = tuple(min(255, int(v * 1.1 + 25)) for v in col) + (200,)
        rice(dd, px, py, 3, 1.4, fill); rice(dd, 2 * cx - px, py, 3, 1.4, fill)
    for s in (-1, 1):  # 耳尖
        for t in range(6):
            rice(dd, cx + s * (tw * .09 + t * .6), hy - tw * .1 - t * 2.2, 3.4, 1.6, (196, 202, 212, 190))
    # 中轴竖墨与底部横基线
    ink0 = (30, 32, 40, 170)
    for yy in range(int(th * .12), th - 3, 6):
        rice(dd, cx + rng.uniform(-.8, .8), yy + rng.uniform(-1, 1), 4.6, 2, ink0)
    for xx in range(int(tw * .08), int(tw * .92), 4):
        dd.ellipse([xx - 2.6, th - 4, xx + 2.6, th - 1.6], fill=ink0)
    dots = dots.filter(ImageFilter.GaussianBlur(.45))  # 洇化
    img.paste(dots, (ox, oy), dots)

    # 外缘补洒墨点（洇化）
    ink = (38, 40, 48) if state != 'complete' else (34, 33, 36)
    layer = Image.new('RGBA', (tw + 12, th + 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    edge = a.filter(ImageFilter.FIND_EDGES)
    pts = [(i % tw, i // tw) for i, v in enumerate(edge.get_flattened_data() if hasattr(edge, 'get_flattened_data') else edge.getdata()) if v > 50]
    for x, y in rng.sample(pts, min(170, len(pts))):
        l = rng.uniform(2.5, 5.5)
        rice(d, x + 6 + rng.uniform(-3, 3), y + 6 + rng.uniform(-3, 3), l, l / rng.uniform(2, 3), ink + (int(rng.uniform(55, 125)),))
    layer = layer.filter(ImageFilter.GaussianBlur(.5))
    img.paste(layer, (ox - 6, oy - 6), layer)

    # 遮挡：供台前沿压回原图（六成），龛柱完全压回
    lip = (nb[0], fy1 - int(H * .012), nb[2], nb[3])
    img.paste(Image.blend(img.crop(lip), orig.crop(lip), .6), lip[:2])
    col = int(W * .006)
    for bx in ((nb[0], nb[1], nb[0] + col, nb[3]), (nb[2] - col, nb[1], nb[2], nb[3])):
        img.paste(orig.crop(bx), bx[:2])

    # 纸纹
    region = img.crop(nb)
    noise = Image.effect_noise(region.size, 40).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: max(240, min(255, 251 + (v - 128) // 14))).convert('RGB')
    region = ImageEnhance.Brightness(ImageChops.multiply(region, noise)).enhance(1.015)
    img.paste(region, nb[:2])

    img.save(SRC / dst)
    pad = int(W * .05)
    crop = img.crop((nb[0] - pad, nb[1] - pad, nb[2] + pad, nb[3] + pad))
    crop.resize((crop.width * 2, crop.height * 2)).save(QA / f'niche-{state}.png')
    print(dst, (W, H), 'niche', nb, 'statue', (ox, oy, tw, th))


if __name__ == '__main__':
    srgb, salpha, bg = statue_dots()
    STATUE_BG = bg
    print('statue', srgb.size, 'bg', bg)
    for i, (src, dst, state) in enumerate(JOBS):
        compose(src, dst, state, srgb, salpha, 7 + i)
