import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu')
SESSION = 'youdu-github-upload'
BASE = 'https://github.com/biaowww/konglie-youdu/upload/main'


def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=90))
    if not response.get('ok', False):
        raise RuntimeError(f'{action} failed: {response}')
    return response.get('data', response)


def files_in(relative):
    folder = ROOT / relative
    return [str(path) for path in sorted(folder.iterdir()) if path.is_file() and path.name != 'push_with_browser_session.py']


def commit_batch(remote, files, summary):
    if not files:
        print(f'SKIP {remote}: no files')
        return
    url = BASE + (f'/{remote}' if remote else '')
    call('navigate', {'url': url, 'newTab': False})
    time.sleep(0.7)
    call('upload', {'selector': 'input[type=file]', 'files': files})
    manifest_started = time.time()
    while time.time() - manifest_started < 90:
        manifest_id = call('evaluate', {'code': "document.querySelector('input[name=manifest_id]')?.value || ''"}).get('value', '')
        if manifest_id:
            break
        time.sleep(0.5)
    else:
        raise RuntimeError(f'Upload manifest was not created for {remote}')
    code = f'''(()=>{{const input=document.querySelector('input[name=message]');if(!input)throw new Error('Commit message input missing');input.value={json.dumps(summary, ensure_ascii=False)};input.dispatchEvent(new Event('input',{{bubbles:true}}));input.form.requestSubmit();return input.value}})()'''
    call('evaluate', {'code': code})
    started = time.time()
    while time.time() - started < 45:
        time.sleep(1)
        current = call('evaluate', {'code': 'location.href'}).get('value', '')
        if '/upload' not in current:
            print(f'OK {remote or "root"}: {len(files)} files -> {current}')
            return
    raise RuntimeError(f'Upload did not complete for {remote}')


batches = [
    ('', files_in(''), 'Add project rules and credits'),
    ('docs', files_in('docs'), 'Add handoff, asset, QA and publishing docs'),
    ('tools', files_in('tools'), 'Add asset, PRD and verification tooling'),
    ('qa', files_in('qa'), 'Add visual verification references'),
    ('qa/full-flow', files_in('qa/full-flow'), 'Add full-flow QA evidence'),
    ('qa/mobile', files_in('qa/mobile'), 'Add mobile QA evidence'),
    ('qa/doc-handoff-final', files_in('qa/doc-handoff-final'), 'Add final handoff document QA'),
    ('qa/doc-handoff', files_in('qa/doc-handoff'), 'Add handoff document review'),
    ('qa/doc-prd', files_in('qa/doc-prd'), 'Add PRD document review'),
    ('app', files_in('app'), 'Add application configuration'),
    ('app/scripts', files_in('app/scripts'), 'Add preview launcher'),
    ('app/public/assets', files_in('app/public/assets'), 'Add processed game art assets'),
    ('app/src', files_in('app/src'), 'Add application entry and global styles'),
    ('app/src/components', files_in('app/src/components'), 'Add game scene components'),
    ('app/src/components/ui', files_in('app/src/components/ui'), 'Add template UI primitives'),
    ('app/src/game', files_in('app/src/game'), 'Add game content, types and audio'),
    ('app/src/game/puzzles', files_in('app/src/game/puzzles'), 'Add five puzzle implementations'),
    ('app/src/hooks', files_in('app/src/hooks'), 'Add shared hooks'),
    ('app/src/lib', files_in('app/src/lib'), 'Add shared utilities'),
    ('app/src/pages', files_in('app/src/pages'), 'Add application pages'),
]

# Root README was used to create the main branch in the preceding step.
for remote, files, summary in batches:
    if remote == '':
        files = [file for file in files if Path(file).name != 'README.md']
    if remote == 'docs':
        files = [file for file in files if Path(file).name != 'ASSETS.md']
    commit_batch(remote, files, summary)

print('ALL_BATCHES_COMPLETE')
