import json
import time
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu')
SESSION = 'youdu-github-upload'
REPO = 'https://github.com/biaowww/konglie-youdu'
FILES = [
    'app/package-lock.json', 'app/README.md', 'app/public/assets/manifest.json',
    'tools/build_prd.py', 'tools/build_handoff_doc.py',
]


def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=90))
    if not response.get('ok', False):
        raise RuntimeError(f'{action}: {response}')
    return response.get('data', response)


for relative in FILES:
    remote = str(Path(relative).parent)
    for attempt in range(2):
        call('navigate', {'url': f'{REPO}/upload/main/{remote}', 'newTab': False})
        time.sleep(0.6)
        call('upload', {'selector': 'input[type=file]', 'files': [str(ROOT / relative)]})
        started = time.time()
        while time.time() - started < 45:
            manifest = call('evaluate', {'code': "document.querySelector('input[name=manifest_id]')?.value || ''"}).get('value', '')
            if manifest:
                break
            time.sleep(0.4)
        code = f'''(()=>{{const input=document.querySelector('input[name=message]');input.value={json.dumps(f'Add {Path(relative).name}')};input.dispatchEvent(new Event('input',{{bubbles:true}}));input.form.requestSubmit();return input.value}})()'''
        call('evaluate', {'code': code})
        time.sleep(2)
        call('navigate', {'url': f'{REPO}/blob/main/{relative}', 'newTab': False})
        time.sleep(0.5)
        text = call('evaluate', {'code': 'document.body.innerText'}).get('value', '')
        if Path(relative).name in text and 'Page not found' not in text:
            print(f'VERIFIED {relative}', flush=True)
            break
        time.sleep(2)
    else:
        raise RuntimeError(f'Could not verify {relative}')
print('REMAINING_FILES_VERIFIED')
