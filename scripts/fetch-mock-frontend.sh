#!/usr/bin/env bash
set -euo pipefail

VERSION="20260826.7"
DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/vendor/mock-frontend"
WHEEL_URL="https://files.pythonhosted.org/packages/py3/h/home-assistant-frontend/home_assistant_frontend-${VERSION}-py3-none-any.whl"
TMP_WHEEL="$(mktemp -t hats-mock-frontend-XXXXXX)"
EXPECTED_SHA256="a2714fdc1ba9fac29e380ae3b57a37a1a04cbc6f0f58bff3458c2281b9152a94"

command -v curl >/dev/null || { echo "fetch-mock-frontend: curl is required" >&2; exit 1; }
command -v unzip >/dev/null || { echo "fetch-mock-frontend: unzip is required" >&2; exit 1; }
command -v shasum >/dev/null || command -v sha256sum >/dev/null || { echo "fetch-mock-frontend: shasum or sha256sum is required" >&2; exit 1; }

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

if command -v shasum >/dev/null; then
  ACTUAL_SHA256="$(shasum -a 256 "$TMP_WHEEL" | cut -d' ' -f1)"
else
  ACTUAL_SHA256="$(sha256sum "$TMP_WHEEL" | cut -d' ' -f1)"
fi
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
  echo "fetch-mock-frontend: SHA-256 mismatch for $WHEEL_URL" >&2
  echo "fetch-mock-frontend: expected $EXPECTED_SHA256, got $ACTUAL_SHA256" >&2
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
