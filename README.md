# Delivered ✓✓

A 14-day, one-hour-a-day messenger game for rehearsing the Qualgo Lead Product Designer interview.

**Play:** https://minhnguyenrenol.github.io/delivered-game/ English by default; the globe button at the top right switches to Vietnamese.

This web copy keeps progress in the browser on each device. The claude.ai version also syncs progress to your account and has the Coach Thư AI chat.

## Build and test
```
python3 src/build.py                     # writes delivered.html (the claude.ai page)
VEND=<folder with node_modules/{react,react-dom,htm,axe-core}> OUT=<scratch dir> sh tests/run-all.sh
```
`index.html` is `delivered.html` wrapped in a standalone HTML document. The cinematic scenes are Remotion compositions in `cine/`.

Dev docs (PRD, architecture, design, tests, security, release) are in `docs/`.
