import json
import time
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu')
SESSION = 'youdu-github-upload'
BASE = 'https://github.com/biaowww/konglie-youdu'


def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=90))
    if not response.get('ok', False):
        raise RuntimeError(f'{action}: {response}')
    return response.get('data', response)


def immediate_files(relative):
    return sorted((ROOT / relative).glob('*'), key=lambda path: path.name)


items = []
# Root-level files are pushed through the GitHub API separately.
for folder in ['docs', 'tools', 'app/scripts', 'app/public/assets', 'app/src/components', 'app/src/game/puzzles', 'app/src/hooks', 'app/src/lib', 'app/src/pages']:
    for file in immediate_files(folder):
        if file.is_file():
            if folder == 'docs' and file.name == 'ASSETS.md':
                continue
            if folder == 'tools' and file.name in {'push_with_browser_session.py', 'upload_browser_batches.py', 'upload_browser_essential.py'}:
                continue
            items.append((file, folder))
for file in immediate_files('app'):
    if file.is_file() and file.name != 'info.md':
        items.append((file, 'app'))
for file in immediate_files('app/src'):
    if file.is_file():
        items.append((file, 'app/src'))
for file in immediate_files('app/src/game'):
    if file.is_file():
        items.append((file, 'app/src/game'))
items.extend([
    (ROOT / 'qa/full-flow/report.json', 'qa/full-flow'),
    (ROOT / 'qa/mobile/report.json', 'qa/mobile'),
])


def upload_file(file, remote):
    directory_url = f'{BASE}/upload/main/{remote}' if remote else f'{BASE}/upload/main'
    call('navigate', {'url': directory_url, 'newTab': False})
    ready_started = time.time()
    while time.time() - ready_started < 15:
        ready = call('evaluate', {'code': "!!document.querySelector('input[type=file]')"}).get('value', False)
        if ready:
            break
        time.sleep(0.5)
    else:
        raise RuntimeError(f'Upload input unavailable for {directory_url}')
    call('upload', {'selector': 'input[type=file]', 'files': [str(file)]})
    started = time.time()
    while time.time() - started < 45:
        manifest = call('evaluate', {'code': "document.querySelector('input[name=manifest_id]')?.value || ''"}).get('value', '')
        if manifest:
            break
        time.sleep(0.4)
    else:
        raise RuntimeError(f'No manifest for {file}')
    summary = f'Add {file.name}'
    code = f'''(()=>{{const input=document.querySelector('input[name=message]');if(!input)throw new Error('Commit input missing');input.value={json.dumps(summary)};input.dispatchEvent(new Event('input',{{bubbles:true}}));input.form.requestSubmit();return input.value}})()'''
    call('evaluate', {'code': code})
    started = time.time()
    while time.time() - started < 40:
        time.sleep(0.6)
        current = call('evaluate', {'code': 'location.href'}).get('value', '')
        if current.startswith('chrome-error'):
            raise RuntimeError(f'Browser error while committing {file}')
        if '/upload' not in current:
            print(f'OK {remote}/{file.name}', flush=True)
            return
    raise RuntimeError(f'Commit timed out for {file}')


for index, (file, remote) in enumerate(items, start=1):
    print(f'[{index}/{len(items)}] {remote}/{file.name}', flush=True)
    upload_file(file, remote)

print('ESSENTIAL_UPLOAD_COMPLETE')
