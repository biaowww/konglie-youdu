import json
import urllib.request
import zipfile
from pathlib import Path

body = json.dumps({
    'action': 'cdp',
    'args': {'method': 'Network.getCookies', 'params': {'urls': ['https://github.com']}},
    'session': 'youdu-github-upload',
}).encode()
response = json.load(urllib.request.urlopen(urllib.request.Request(
    'http://127.0.0.1:10086/command', data=body, headers={'Content-Type': 'application/json'})))
cookies = response.get('data', {}).get('cookies', [])
cookie_header = '; '.join(f"{cookie['name']}={cookie['value']}" for cookie in cookies)
request = urllib.request.Request(
    'https://github.com/biaowww/konglie-youdu/archive/refs/heads/main.zip',
    headers={'Cookie': cookie_header, 'User-Agent': 'Youdu-Remote-Verify'},
)
data = urllib.request.urlopen(request, timeout=120).read()
out = Path('/Users/wvngbvao483/offcircle_dev/konglie-youdu/qa/remote-source.zip')
out.write_bytes(data)
with zipfile.ZipFile(out) as archive:
    archive.extractall('/Users/wvngbvao483/offcircle_dev/konglie-youdu/qa/remote-source')
    print({'bytes': len(data), 'files': len(archive.namelist())})
