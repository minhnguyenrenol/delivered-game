#!/usr/bin/env python3
"""Assemble delivered.html from src/. Run: python3 src/build.py"""
import json, pathlib, re, subprocess, sys
SRC = pathlib.Path(__file__).parent
OUT = SRC.parent / 'delivered.html'
content = json.loads((SRC / 'content.json').read_text())
# v2: English overlay for the book's Vietnamese text, and spoken sample answers for follow-ups
I18N = SRC / 'i18n'
def at(path):
    o = content
    for k in path.split('.'): o = o[int(k)] if isinstance(o, list) else o[k]
    return o
overlay = {}
for f in sorted(I18N.glob('en-*.json')):
    for path, text in json.loads(f.read_text()).items():
        assert isinstance(at(path), str), f'{f.name}: {path} is not a string'
        overlay[path] = text
content['_en'] = overlay
fu_file = I18N / 'followups.json'
if fu_file.exists():
    for path, extra in json.loads(fu_file.read_text()).items():
        if path.startswith('cards.'): at(path).update(extra)
js_json = json.dumps(content, ensure_ascii=False).replace('</', '<\\/')
css = (SRC / 'app.css').read_text()
import base64  # cinematic scenes rendered with Remotion (see cine/), embedded so they play offline
MIME = {'.mp4': 'video/mp4', '.webm': 'video/webm'}
cine = {}
for p in sorted((SRC / 'media').iterdir()):
    if p.suffix in MIME: cine.setdefault(p.stem, {})[p.suffix[1:]] = f'data:{MIME[p.suffix]};base64,' + base64.b64encode(p.read_bytes()).decode()
cine_json = json.dumps(cine)
order = ['i18n.js', 'data.js', 'engine.js', 'sound.js', 'ui1.js', 'ui2.js', 'ui4.js', 'ui3.js']
for f in order:  # syntax check each file
    r = subprocess.run(['node', '--check', str(SRC / f)], capture_output=True, text=True)
    if r.returncode: sys.exit(f'syntax error in {f}:\n{r.stderr}')
app = '\n'.join(f'/* ==== {f} ==== */\n' + (SRC / f).read_text() for f in order)
assert '</script' not in app.lower(), 'script terminator inside JS'
html = f'''<title>Delivered ✓✓</title>
<meta name="description" content="A 14-day messenger game for Minh's Qualgo Lead Product Designer interview.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&family=Unbounded:wght@500;600&display=swap">
<style>
{css}
</style>
<div id="root"></div>
<script type="application/json" id="content">{js_json}</script>
<script type="application/json" id="cine">{cine_json}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>
<script>
{app}
</script>
'''
OUT.write_text(html)
print(f'wrote {OUT} ({len(html.encode()):,} bytes)')
