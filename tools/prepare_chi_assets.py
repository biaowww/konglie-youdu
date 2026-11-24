from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json
import os

Image.MAX_IMAGE_PIXELS = None
if 'YOUDU_DRIVE_ROOT' not in os.environ:
    raise SystemExit('Set YOUDU_DRIVE_ROOT to the local 元艺极客和超元 directory.')
ROOT = Path(os.environ['YOUDU_DRIVE_ROOT'])
ART = ROOT / 'ProjectBreach/游戏共创Callab（x甜菜）/03 Art'
OLD = ROOT / 'ProjectBreach/游戏共创Callab（x甜菜）/_prototype'
OUT = Path(__file__).resolve().parents[1] / 'app/public/assets/chi'
OUT.mkdir(parents=True, exist_ok=True)


def paper_sprite(image):
    image = image.convert('RGBA')
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
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            luminance = red * .2126 + green * .7152 + blue * .0722
            saturation = max(red, green, blue) - min(red, green, blue)
            paper_light = max(0, min(1, (luminance - 212) / 28))
            paper_neutral = max(0, min(1, (40 - saturation) / 40))
            pixels[x, y] = (red, green, blue, min(alpha, round(255 * (1 - paper_light * paper_neutral))))
    alpha = image.getchannel('A').point(lambda value: 0 if value < 10 else value)
    image.putalpha(alpha)
    bbox = alpha.getbbox()
    return image.crop(bbox) if bbox else image


def export(source, name, maximum=1200, sprite=True):
    image = ImageOps.exif_transpose(Image.open(source))
    original_size = image.size
    image.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
    if sprite:
        image = paper_sprite(image)
    elif image.mode != 'RGBA':
        image = image.convert('RGB')
    image.save(OUT / name, 'WEBP', quality=88, method=6)
    return {'source': str(source), 'originalSize': original_size, 'outputSize': image.size, 'bytes': (OUT / name).stat().st_size}


manifest = {
    'you.webp': export(ART / '角色和关键道具/游/游-形象1（未拟人化）.jpg', 'you.webp'),
    'statue.webp': export(ART / '猫神像(传送门）/神像6.png', 'statue.webp'),
    'jade.webp': export(OLD / '01_character_art/sprites/props/jade_c_glow.png', 'jade.webp', 512),
    'yin.webp': export(ART / '角色和关键道具/隐-引导npc/隐-对话框形象.png', 'yin.webp', 512),
    'fen.webp': export(ART / '角色和关键道具/忿-反派/CATCAT29.JPG', 'fen.webp'),
    'temple.webp': export(ART / '场景/五毒/痴/痴 山腰古寺.JPG', 'temple.webp', 1920, False),
}
sheet = Image.open(ART / 'ui:CG:演出/ui-elements-cropped.jpg')
crops = {
    'ui-action-outer.webp': (45, 55, 195, 200),
    'ui-action-inner.webp': (45, 445, 195, 610),
    'ui-volume-outer.webp': (375, 45, 745, 200),
    'ui-volume-inner.webp': (375, 445, 760, 640),
    'ui-settings-outer.webp': (850, 45, 1045, 205),
    'ui-settings-inner.webp': (850, 445, 1045, 625),
}
for name, rect in crops.items():
    image = sheet.crop(rect)
    image = paper_sprite(image)
    image.save(OUT / name, 'WEBP', quality=90, method=6)
    manifest[name] = {'source': 'ui-elements-cropped.jpg', 'crop': rect, 'outputSize': image.size, 'bytes': (OUT / name).stat().st_size}

manifest_path = OUT.parent.parent.parent / 'chi-art-manifest.json'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'exported': len(manifest), 'out': str(OUT)}, ensure_ascii=False))
