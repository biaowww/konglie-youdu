from pathlib import Path
from PIL import Image
import json
import os

if 'YOUDU_ART_ROOT' not in os.environ:
    raise SystemExit('Set YOUDU_ART_ROOT to the 03 Art directory.')
ART_ROOT = Path(os.environ['YOUDU_ART_ROOT'])
CANDIDATES = ART_ROOT / 'AI生成资产'
OUT = Path(__file__).resolve().parents[1] / 'app/public/assets/art-reboot'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {'status': 'AI-assisted test assets; not final production art', 'assets': {}}

for key in ['you', 'statue', 'city', 'temple', 'lamp', 'yin', 'fen']:
    version = 'v2' if key == 'yin' else 'v1'
    ink_candidate = CANDIDATES / 'comparisons' / f'gpt-{key}-ink-v1.png'
    source = ink_candidate if ink_candidate.exists() else CANDIDATES / 'kimi' / f'20261124_art_reboot_kimi_{key}_{version}.png'
    if not source.exists():
        raise FileNotFoundError(source)
    image = Image.open(source).convert('RGBA')
    original_size = image.size
    image.thumbnail((1920 if key in {'city', 'temple'} else 1024, 1920), Image.Resampling.LANCZOS)
    target = OUT / f'{key}.webp'
    image.save(target, 'WEBP', quality=88, method=6)
    manifest['assets'][key] = {'source': source.name, 'originalSize': original_size, 'outputSize': image.size, 'bytes': target.stat().st_size}

sheet_path = CANDIDATES / 'comparisons' / 'gpt-ui_sheet-ink-v1.png'
if not sheet_path.exists():
    sheet_path = CANDIDATES / 'kimi' / '20261124_art_reboot_kimi_ui_sheet_v1.png'
sheet = Image.open(sheet_path).convert('RGBA')
cell_w, cell_h = sheet.width // 4, sheet.height // 2
for row, suffix in enumerate(['outer', 'inner']):
    for column, name in enumerate(['back', 'volume', 'hint', 'reset']):
        cell = sheet.crop((column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h))
        mask = cell.getchannel('A').point(lambda value: 255 if value > 80 else 0)
        bbox = mask.getbbox()
        if not bbox:
            raise ValueError(f'Empty UI cell: {name}-{suffix}')
        left, top, right, bottom = bbox
        margin = 8
        cell = cell.crop((max(0, left - margin), max(0, top - margin), min(cell.width, right + margin), min(cell.height, bottom + margin)))
        cell.thumbnail((220, 220), Image.Resampling.LANCZOS)
        icon = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        icon.alpha_composite(cell, ((256 - cell.width) // 2, (256 - cell.height) // 2))
        target = OUT / f'ui-{name}-{suffix}.webp'
        icon.save(target, 'WEBP', quality=90, method=6)
        manifest['assets'][f'ui-{name}-{suffix}'] = {'source': 'ui_sheet_v1', 'cell': [column, row], 'outputSize': icon.size, 'bytes': target.stat().st_size}

cinematic_out = OUT / 'cinematic'
cinematic_out.mkdir(exist_ok=True)
for key in ['scene-outer', 'scene-inner', 'scene-complete', 'comic-01', 'comic-02', 'comic-03', 'comic-04']:
    source = CANDIDATES / 'comparisons' / f'gpt-{key}-ink-v1.png'
    if not source.exists():
        raise FileNotFoundError(source)
    image = Image.open(source).convert('RGBA')
    image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
    target = cinematic_out / f'{key}.webp'
    image.save(target, 'WEBP', quality=88, method=6)
    manifest['assets'][key] = {'source': source.name, 'outputSize': image.size, 'bytes': target.stat().st_size}

manifest_path = OUT.parent.parent.parent / 'art-reboot-manifest.json'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'exported': len(manifest['assets']), 'out': str(OUT)}, ensure_ascii=False))
