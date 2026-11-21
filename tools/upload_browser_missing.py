import json
import time
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu')
SESSION = 'youdu-github-upload'
BASE = 'https://github.com/biaowww/konglie-youdu'
FILES = [
    'app/package-lock.json',
]


def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=90))
    if not response.get('ok', False):
        raise RuntimeError(f'{action}: {response}')
    return response.get('data', response)


def commit_file(relative):
    remote = str(Path(relative).parent)
    file = ROOT / relative
    call('network', {'cmd': 'start'})
    call('navigate', {'url': f'{BASE}/upload/main/{remote}', 'newTab': False})
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
        raise RuntimeError(f'Binary upload incomplete for {relative}')
    code = f'''(()=>{{const input=document.querySelector('input[name=message]');input.value={json.dumps(f'Add {file.name}')};input.dispatchEvent(new Event('input',{{bubbles:true}}));input.form.requestSubmit();return input.value}})()'''
    call('evaluate', {'code': code})
    started = time.time()
    while time.time() - started < 45:
        time.sleep(1)
        data = call('network', {'cmd': 'list', 'filter': 'upload'})
        posts = [item for item in data.get('requests', []) if item.get('method') == 'POST' and item.get('url') == f'{BASE}/upload']
        jobs = [item for item in data.get('requests', []) if '/_jobs/commit_upload_manifest_' in item.get('url', '') and item.get('status') == 200 and item.get('completed')]
        if posts and posts[-1].get('status') == 200 and jobs:
            return True
    return False


for relative in FILES:
    success = False
    for attempt in range(2):
        if commit_file(relative):
            success = True
            break
        time.sleep(2)
    if not success:
        raise RuntimeError(f'Commit job did not complete: {relative}')
    print(f'JOB_OK {relative}', flush=True)
print('ALL_MISSING_JOBS_COMPLETE')
