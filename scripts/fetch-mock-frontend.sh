#!/usr/bin/env bash
set -euo pipefail

VERSION="20260826.7"
DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/vendor/mock-frontend"
WHEEL_URL="https://files.pythonhosted.org/packages/py3/h/home-assistant-frontend/home_assistant_frontend-${VERSION}-py3-none-any.whl"
TMP_WHEEL="$(mktemp -t hats-mock-frontend-XXXXXX.whl)"

command -v curl >/dev/null || { echo "fetch-mock-frontend: curl is required" >&2; exit 1; }
command -v unzip >/dev/null || { echo "fetch-mock-frontend: unzip is required" >&2; exit 1; }

if [ -d "$DEST_DIR/hass_frontend" ]; then
  echo "fetch-mock-frontend: already extracted at $DEST_DIR/hass_frontend, skipping"
  exit 0
fi

echo "fetch-mock-frontend: downloading home-assistant-frontend ${VERSION}..."
if ! curl -fsSL -o "$TMP_WHEEL" "$WHEEL_URL"; then
  echo "fetch-mock-frontend: FAILED to download $WHEEL_URL" >&2
  rm -f "$TMP_WHEEL"
  exit 1
fi

mkdir -p "$DEST_DIR"
unzip -q -o "$TMP_WHEEL" "hass_frontend/*" -d "$DEST_DIR"
rm -f "$TMP_WHEEL"

if [ ! -f "$DEST_DIR/hass_frontend/index.html" ]; then
  echo "fetch-mock-frontend: extraction did not produce hass_frontend/index.html" >&2
  exit 1
fi

echo "fetch-mock-frontend: extracted to $DEST_DIR/hass_frontend"
