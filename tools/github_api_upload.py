import base64
import json
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu')
REPO = 'biaowww/konglie-youdu'
SESSION = 'youdu-github-upload'


def browser_cookies():
    body = json.dumps({
        'action': 'cdp',
        'args': {'method': 'Network.getCookies', 'params': {'urls': ['https://github.com']}},
        'session': SESSION,
    }).encode()
    request = urllib.request.Request('http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})
    response = json.load(urllib.request.urlopen(request, timeout=30))
    cookies = response.get('data', {}).get('cookies', [])
    return '; '.join(f"{cookie['name']}={cookie['value']}" for cookie in cookies)


COOKIE = browser_cookies()


def api(path, method='GET', payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        f'https://api.github.com{path}',
        data=data,
        method=method,
        headers={
            'Cookie': COOKIE,
            'User-Agent': 'Youdu-Contents-Uploader',
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read()
        return response.status, json.loads(body) if body else {}


status, user = api('/user')
print(f'AUTH_OK {user.get("login")}', flush=True)

files = subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines()
skip = {
    'README.md', 'docs/ASSETS.md',
    'tools/push_with_browser_session.py',
    'tools/upload_browser_batches.py',
    'tools/upload_browser_essential.py',
    'tools/github_api_upload.py',
}
files = [file for file in files if file not in skip and 'chrome-profile' not in file]

for index, relative in enumerate(files, start=1):
    source = ROOT / relative
    encoded = base64.b64encode(source.read_bytes()).decode('ascii')
    endpoint = f'/repos/{REPO}/contents/{urllib.parse.quote(relative)}'
    payload = {'message': f'Add {relative}', 'content': encoded, 'branch': 'main'}
    try:
        api(endpoint, 'PUT', payload)
    except urllib.error.HTTPError as error:
        if error.code not in (409, 422):
            raise
        _, current = api(endpoint)
        payload['sha'] = current['sha']
        api(endpoint, 'PUT', payload)
    if index % 10 == 0 or index == len(files):
        print(f'UPLOADED {index}/{len(files)}', flush=True)
    time.sleep(0.06)

print(f'API_UPLOAD_COMPLETE {len(files)} files')
