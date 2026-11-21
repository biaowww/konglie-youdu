import json
import time
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu/app/public/assets')
SESSION = 'youdu-github-upload'
REPO = 'https://github.com/biaowww/konglie-youdu'
REMOTE_DIR = 'app/public/assets'


def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=90))
    if not response.get('ok', False):
        raise RuntimeError(f'{action}: {response}')
    return response.get('data', response)


def remote_existing():
    call('navigate', {'url': f'{REPO}/tree/main/{REMOTE_DIR}', 'newTab': False})
    time.sleep(0.6)
    return call('evaluate', {'code': "document.querySelector('table')?.innerText || ''"}).get('value', '')


def upload_and_verify(file):
    call('navigate', {'url': f'{REPO}/upload/main/{REMOTE_DIR}', 'newTab': False})
    time.sleep(0.6)
    call('upload', {'selector': 'input[type=file]', 'files': [str(file)]})
    started = time.time()
    while time.time() - started < 45:
        manifest = call('evaluate', {'code': "document.querySelector('input[name=manifest_id]')?.value || ''"}).get('value', '')
        if manifest:
            break
        time.sleep(0.4)
    code = f'''(()=>{{const input=document.querySelector('input[name=message]');input.value={json.dumps(f'Add {file.name}')};input.dispatchEvent(new Event('input',{{bubbles:true}}));input.form.requestSubmit();return input.value}})()'''
    call('evaluate', {'code': code})
    time.sleep(2)
    call('navigate', {'url': f'{REPO}/blob/main/{REMOTE_DIR}/{file.name}', 'newTab': False})
    time.sleep(0.6)
    text = call('evaluate', {'code': 'document.body.innerText'}).get('value', '')
    return file.name in text and 'Page not found' not in text


existing = remote_existing()
verified_before = {'du.webp', 'card-cat.webp', 'card-dragon.webp', 'card-frame.webp', 'card-statue.webp', 'card-tree.webp', 'chen-inner.webp', 'chen-outer.webp', 'chi-scene.webp', 'city.webp', 'fen-red.webp', 'jade.webp', 'logo.webp', 'man-scene.webp', 'map.webp', 'mountain-a.webp', 'mountain-b.webp', 'mountain-c.webp', 'statue.webp', 'tan-scene.webp', 'travel-inner.webp', 'travel-outer.webp', 'world-map.webp', 'yi-scene.webp', 'yin-icon.webp', 'you-back.webp', 'you-front.webp', 'you-icon.webp'}
files = [file for file in sorted(ROOT.iterdir()) if file.is_file() and file.name != 'manifest.json' and file.name not in verified_before]
print(f'MISSING {len(files)}', flush=True)
for index, file in enumerate(files, start=1):
    success = False
    for attempt in range(2):
        if upload_and_verify(file):
            success = True
            break
        time.sleep(2)
    if not success:
        raise RuntimeError(f'Upload could not be verified after retry: {file.name}')
    print(f'VERIFIED {index}/{len(files)} {file.name}', flush=True)
print('ALL_ART_UPLOADED_AND_VERIFIED')
