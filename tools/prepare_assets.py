from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageSequence
import json
import os

Image.MAX_IMAGE_PIXELS = None
if 'YOUDU_DRIVE_ROOT' not in os.environ:
    raise SystemExit('Set YOUDU_DRIVE_ROOT to the local 元艺极客和超元 directory before preparing assets.')
DRIVE = Path(os.environ['YOUDU_DRIVE_ROOT'])
ART = DRIVE / 'ProjectBreach/游戏共创Callab（x甜菜）/03 Art'
OLD = DRIVE / 'ProjectBreach/游戏共创Callab（x甜菜）/_prototype'
OUT = Path(__file__).resolve().parents[1] / 'app/public/assets'
OUT.mkdir(parents=True, exist_ok=True)

ASSETS = {
    'map': (ART / '地图/地图.png', 2200),
    'you-icon': (ART / '角色和关键道具/游/游-onthemap.png', 512),
    'yin-icon': (ART / '角色和关键道具/隐-引导npc/隐-对话框形象.png', 512),
    'logo': (ART / 'ui:CG:演出/logo/logo.png', 512),
    'chen-outer': (ART / '场景/五毒/嗔/表世界树上小庙.JPG', 1920),
    'chen-inner': (ART / '场景/五毒/嗔/里世界树上小庙.png', 1920),
    'chi-scene': (ART / '场景/五毒/痴/痴 山腰古寺.JPG', 1920),
    'man-scene': (ART / '场景/五毒/慢/慢-小庙堂.png', 1920),
    'yi-scene': (ART / '场景/五毒/疑/疑 碑林.png', 1920),
    'tan-scene': (ART / '场景/五毒/贪/贪 大殿.JPG', 1920),
    'travel-outer': (ART / '场景/行进（用于场景切换）/1（入口，偏里世界）.png', 1920),
    'travel-inner': (ART / '场景/行进（用于场景切换）/2（行进图，偏里世界）.jpg', 1920),
    'mountain-a': (ART / 'ui:CG:演出/open+end地形播放展示/IMG_9738.png', 1920),
    'mountain-b': (ART / 'ui:CG:演出/open+end地形播放展示/IMG_9743.png', 1920),
    'mountain-c': (ART / 'ui:CG:演出/open+end地形播放展示/IMG_9744.png', 1920),
    'statue': (ART / '猫神像(传送门）/神像6.png', 900),
    'du': (ART / '角色和关键道具/渡/游猫.png', 1000),
    'fen-red': (ART / '角色和关键道具/忿-反派/CATCAT30.JPG', 900),
    'fen-green': (ART / '角色和关键道具/忿-反派/CATCAT24.JPG', 900),
    'card-frame': (ART / '卡牌/卡牌框1.jpg', 900),
    'card-tree': (ART / '卡牌/隐藏元素（世界观展示）/IMG_9748.png', 900),
    'card-dragon': (ART / '卡牌/隐藏元素（世界观展示）/龙pdf.pdf.png', 900),
    'card-cat': (ART / '卡牌/隐藏元素（世界观展示）/IMG_9754.png', 900),
    'card-statue': (ART / '卡牌/隐藏元素（世界观展示）/IMG_9740.png', 900),
    'you-back': (OLD / '01_character_art/sprites/back/you_back_shrine.png', 900),
    'you-front': (OLD / '01_character_art/sprites/turnaround/front.png', 900),
    'you-side': (OLD / '01_character_art/sprites/turnaround/left_side.png', 900),
    'jade': (OLD / '01_character_art/sprites/props/jade_c_glow.png', 512),
    'you-walk-gif': (OLD / '01_character_art/animation/walk_24/you_walk_24.gif', 512),
    'city': (DRIVE / 'ProjectBreach/美术Art/世界和场景美术/位面城概念.png', 1920),
    'world-map': (DRIVE / 'ProjectBreach/美术Art/世界和场景美术/大地图.png', 1920),
}


def flatten(image, color=(225, 228, 227)):
    rgba = image.convert('RGBA')
    base = Image.new('RGBA', rgba.size, (*color, 255))
    base.alpha_composite(rgba)
    return base.convert('RGB')


def remove_edge_background(image, crop=True):
    image = image.convert('RGBA')
    # Flood only from edges: pale blue body details are preserved even when
    # their luminance is close to the paper background.
    points = []
    for x in range(0, image.width, 12):
        points.extend([(x, 0), (x, image.height - 1)])
    for y in range(0, image.height, 12):
        points.extend([(0, y), (image.width - 1, y)])
    for point in points:
        try:
            ImageDraw.floodfill(image, point, (0, 0, 0, 0), thresh=24)
        except (ValueError, RuntimeError):
            pass
    bbox = image.getchannel('A').getbbox()
    return image.crop(bbox) if bbox and crop else image


def paper_sprite(image):
    image = remove_edge_background(image)
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            high = max(red, green, blue)
            low = min(red, green, blue)
            luminance = red * .2126 + green * .7152 + blue * .0722
            paper_light = max(0, min(1, (luminance - 212) / 28))
            paper_neutral = max(0, min(1, (40 - (high - low)) / 40))
            pixels[x, y] = (red, green, blue, min(alpha, round(255 * (1 - paper_light * paper_neutral))))
    alpha = image.getchannel('A').point(lambda value: 0 if value < 10 else value)
    image.putalpha(alpha)
    bbox = alpha.getbbox()
    return image.crop(bbox) if bbox else image


def ink_frame(image):
    image = image.convert('RGBA')
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, _ = pixels[x, y]
            luminance = round(red * .2126 + green * .7152 + blue * .0722)
            alpha = max(0, min(210, (198 - luminance) * 5))
            pixels[x, y] = (232, 224, 208, alpha)
    return image


manifest = {'sourceRoot': str(ART), 'assets': {}, 'missing': []}
for name, (source, max_size) in ASSETS.items():
    if not source.exists():
        manifest['missing'].append({'name': name, 'source': str(source)})
        continue
    image = ImageOps.exif_transpose(Image.open(source))
    original_size = image.size
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    if name == 'yi-scene':
        image = flatten(image)
    elif name == 'du':
        image = remove_edge_background(image)
    elif name in {'fen-red', 'fen-green'}:
        image = paper_sprite(image)
    elif name == 'card-frame':
        image = ink_frame(image)
    if name == 'you-walk-gif':
        target = OUT / f'{name}.gif'
        target.write_bytes(source.read_bytes())
    else:
        target = OUT / f'{name}.webp'
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        image.save(target, 'WEBP', quality=84, method=6)
    manifest['assets'][name] = {
        'source': str(source), 'file': target.name, 'originalSize': original_size,
        'size': image.size, 'bytes': target.stat().st_size,
    }

walk_source = OLD / '01_character_art/animation/walk_24/you_walk_24.gif'
if walk_source.exists():
    walk_frames = []
    walk_durations = []
    with Image.open(walk_source) as walk:
        for frame in ImageSequence.Iterator(walk):
            walk_frames.append(remove_edge_background(frame, crop=False))
            walk_durations.append(frame.info.get('duration', 40))
    walk_target = OUT / 'you-walk-alpha.webp'
    walk_frames[0].save(
        walk_target, 'WEBP', save_all=True, append_images=walk_frames[1:],
        duration=walk_durations, loop=0, quality=84, method=6,
    )
    manifest['assets']['you-walk-alpha'] = {
        'source': str(walk_source), 'file': walk_target.name,
        'originalSize': walk_frames[0].size, 'size': walk_frames[0].size,
        'bytes': walk_target.stat().st_size, 'frames': len(walk_frames),
        'status': 'AI-assisted test animation; background removed; not cleaned production art',
    }

manifest_path = OUT.parent.parent / 'art-manifest.json'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'exported': len(manifest['assets']), 'missing': manifest['missing'], 'out': str(OUT), 'manifest': str(manifest_path)}, ensure_ascii=False, indent=2))
