#!/usr/bin/env bash
set -euo pipefail

rm -rf public
mkdir -p public/chapters

cat \
  content-pack/chapters.part.00 \
  content-pack/chapters.part.01 \
  content-pack/chapters.part.02fix.00 \
  content-pack/chapters.part.02fix.01 \
  content-pack/chapters.part.02fix.02 \
  content-pack/chapters.part.02fix.03 \
  content-pack/chapters.part.03 \
  content-pack/chapters.part.04 \
  | base64 --decode > /tmp/chapters-preview.tar.gz

echo "1e543a97d5da8ebd02f1be64cc2be8adb5c2937f414c72b27b14869cc24fdc35  /tmp/chapters-preview.tar.gz" | sha256sum --check
tar -xzf /tmp/chapters-preview.tar.gz -C public/chapters

cp index.html public/index.html
cp chapter.html public/chapter.html
cp arama.js public/arama.js
cp rehber.js public/rehber.js
cp live-ai.js public/live-ai.js

touch public/.nojekyll

python3 - <<'PY'
from pathlib import Path
for name in ('index.html', 'chapter.html'):
    path = Path('public') / name
    html = path.read_text(encoding='utf-8')
    tag = '<script src="live-ai.js?v=3"></script>'
    if tag not in html:
        html = html.replace('</body>', f'{tag}</body>')
    path.write_text(html, encoding='utf-8')
PY

test -f public/index.html
test -f public/chapter.html
test -f public/chapters/index.json
test "$(find public/chapters -maxdepth 1 -name '[0-9][0-9].json' | wc -l)" -eq 24
node --check public/arama.js
node --check public/rehber.js
node --check public/live-ai.js

echo "Tam metinli site ve canlı model istemcisi hazır."
