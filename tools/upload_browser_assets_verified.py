import json
import time
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu/app/public/assets')
SESSION = 'youdu-github-upload'
BASE = 'https://github.com/biaowww/konglie-youdu'
SKIP = {'du.webp', 'card-cat.webp', 'you-side.webp', 'manifest.json'}


def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=90))
    if not response.get('ok', False):
        raise RuntimeError(f'{action}: {response}')
    return response.get('data', response)


def commit_file(file):
    call('network', {'cmd': 'start'})
    call('navigate', {'url': f'{BASE}/upload/main/app/public/assets', 'newTab': False})
    time.sleep(0.7)
    call('upload', {'selector': 'input[type=file]', 'files': [str(file)]})
    started = time.time()
    while time.time() - started < 75:
        network = call('network', {'cmd': 'list', 'filter': 'upload'})
        requests = network.get('requests', [])
        policy_done = any('/policies/upload-manifest-files' in item.get('url', '') and item.get('status') == 201 and item.get('completed') for item in requests)
        object_done = any('objects-origin' in item.get('url', '') and item.get('status') == 204 and item.get('completed') for item in requests)
        manifest_done = any('/upload/upload-manifest-files/' in item.get('url', '') and item.get('method') == 'PUT' and item.get('status') == 200 and item.get('completed') for item in requests)
        if policy_done and object_done and manifest_done:
            break
        time.sleep(0.5)
    else:
        raise RuntimeError(f'Binary upload incomplete for {file.name}')
    code = f'''(()=>{{const input=document.querySelector('input[name=message]');input.value={json.dumps(f'Add {file.name}')};input.dispatchEvent(new Event('input',{{bubbles:true}}));input.form.requestSubmit();return input.value}})()'''
    call('evaluate', {'code': code})
    started = time.time()
    while time.time() - started < 30:
        time.sleep(1)
        data = call('network', {'cmd': 'list', 'filter': 'upload'})
        posts = [item for item in data.get('requests', []) if item.get('method') == 'POST' and item.get('url') == f'{BASE}/upload']
        if posts and posts[-1].get('completed'):
            return posts[-1].get('status') == 200
    return False


files = [file for file in sorted(ROOT.iterdir()) if file.is_file() and file.name not in SKIP]
for index, file in enumerate(files, start=1):
    success = False
    for attempt in range(2):
        if commit_file(file):
            success = True
            break
        time.sleep(2)
    if not success:
        raise RuntimeError(f'Upload failed twice: {file.name}')
    print(f'POST_OK {index}/{len(files)} {file.name}', flush=True)
print('ALL_POSTS_SUCCESS')
