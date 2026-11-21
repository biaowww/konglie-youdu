import json
import subprocess
import urllib.request

REPO = '/Users/wvngbvao483/offcircle_dev/konglie-youdu'
request_body = json.dumps({
    'action': 'cdp',
    'args': {'method': 'Network.getCookies', 'params': {'urls': ['https://github.com']}},
    'session': 'youdu-github-upload',
}).encode()
request = urllib.request.Request(
    'http://127.0.0.1:10086/command',
    data=request_body,
    headers={'Content-Type': 'application/json'},
)
response = json.load(urllib.request.urlopen(request, timeout=20))
cookies = response.get('data', {}).get('cookies', [])
if not any(cookie.get('name') == 'user_session' for cookie in cookies):
    raise SystemExit('No GitHub user_session cookie is available')
cookie_header = '; '.join(f"{cookie['name']}={cookie['value']}" for cookie in cookies)
username = next((cookie['value'] for cookie in cookies if cookie.get('name') == 'dotcom_user'), 'biaowww')
result = subprocess.run(
    ['git', '-c', f'http.cookieHeader={cookie_header}', 'push', f'https://{username}@github.com/biaowww/konglie-youdu.git', 'main'],
    cwd=REPO,
    capture_output=True,
    text=True,
    timeout=240,
)
print(result.stdout, end='')
print(result.stderr, end='')
raise SystemExit(result.returncode)
