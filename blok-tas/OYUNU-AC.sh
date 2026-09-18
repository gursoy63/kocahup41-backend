#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
GAME_HTML="$DIR/index.html"
URL="http://127.0.0.1:3000/blok-tas/"

if curl -sf -o /dev/null "$URL" 2>/dev/null; then
  TARGET="$URL"
elif command -v node >/dev/null 2>&1 && [ -f "$DIR/../server.js" ]; then
  (cd "$DIR/.." && node server.js >/tmp/blok-tas-server.log 2>&1 &)
  sleep 0.7
  if curl -sf -o /dev/null "$URL" 2>/dev/null; then
    TARGET="$URL"
  else
    TARGET="file://$GAME_HTML"
  fi
else
  TARGET="file://$GAME_HTML"
fi

if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --new-window "$TARGET" >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$TARGET" >/dev/null 2>&1 &
fi
