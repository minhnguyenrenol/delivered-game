#!/bin/sh
# Runs every test. Needs: node, playwright (global), VEND=<folder with node_modules/{react,react-dom,htm,axe-core}>, OUT=<scratch dir>
set -e
cd "$(dirname "$0")"
python3 ../src/build.py
mkdir -p "$OUT"
export NODE_PATH="$(npm root -g)"
echo "== unit (v1 engine, Vietnamese mode)"; node unit.js | grep -v '^PASS' || true
echo "== unit v2 (English content, follow-ups, plain language, scenes)"; node unit-v2.js | grep -v '^PASS' || true
echo "== e2e (v1 flows, Vietnamese mode)"; node e2e.js
echo "== e2e v2 (English, language switch, scenes, scripts, rehearsal)"; node e2e-v2.js
echo "== a11y (English)"; node a11y.js
