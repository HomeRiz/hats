#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/vendor/mock-mods"

command -v curl >/dev/null || { echo "fetch-mock-mods: curl is required" >&2; exit 1; }
command -v shasum >/dev/null || command -v sha256sum >/dev/null || { echo "fetch-mock-mods: shasum or sha256sum is required" >&2; exit 1; }

mkdir -p "$DEST_DIR"

sha256_of() {
  if command -v shasum >/dev/null; then
    shasum -a 256 "$1" | cut -d' ' -f1
  else
    sha256sum "$1" | cut -d' ' -f1
  fi
}

fetch_mod() {
  local slug="$1" download_url="$2" expected_sha256="$3"
  local dest_file="$DEST_DIR/${slug}.js"

  if [ -f "$dest_file" ]; then
    if [ "$(sha256_of "$dest_file")" = "$expected_sha256" ]; then
      echo "fetch-mock-mods: $slug already present and verified, skipping"
      return 0
    fi
    echo "fetch-mock-mods: $slug exists but checksum mismatch, re-downloading"
    rm -f "$dest_file"
  else
    echo "fetch-mock-mods: downloading $slug..."
  fi

  local tmp_file
  tmp_file="$(mktemp -t hats-mock-mod-XXXXXX)" || tmp_file="/tmp/hats-mock-mod-$RANDOM"
  if ! curl -fsSL -o "$tmp_file" "$download_url"; then
    echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  local actual_sha256
  actual_sha256="$(sha256_of "$tmp_file")"
  if [ "$actual_sha256" != "$expected_sha256" ]; then
    echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
    echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  mv "$tmp_file" "$dest_file"
  echo "fetch-mock-mods: verified and installed $slug"
}

fetch_mod "card-mod" \
  "https://raw.githubusercontent.com/thomasloven/lovelace-card-mod/v4.2.1/card-mod.js" \
  "5e7e71ad61796f59070f8c4621e69fa8e71a9864d0be0922bc4dbc72f990cd35"

fetch_mod "bubble-card" \
  "https://raw.githubusercontent.com/Clooos/Bubble-Card/v3.4.1/dist/bubble-card.js" \
  "b96ef3c279a574c1cbd66b23c7efd6bfb0c4817bf094c1c37f4426e403080cfb"

fetch_mod "mushroom-cards" \
  "https://github.com/piitaya/lovelace-mushroom/releases/download/v5.2.3/mushroom.js" \
  "631668268e474d5357e0f17f161322499ea5c93a910431477e112653d7aa456b"

fetch_mod "layout-card" \
  "https://raw.githubusercontent.com/thomasloven/lovelace-layout-card/v2.4.7/layout-card.js" \
  "aa7ed2f010b7453687b02a54dc5372bb0c98451244c1aa40e85d6f7c71608191"

fetch_mod "button-card" \
  "https://github.com/custom-cards/button-card/releases/download/v7.0.1/button-card.js" \
  "5d6e9c6afca01e8014653fa56bb5d6aa9248d832c34fb944a7f2c36329bc22d1"

fetch_mod "stack-in-card" \
  "https://github.com/custom-cards/stack-in-card/releases/download/0.2.0/stack-in-card.js" \
  "3eb3c890907277c5e49f0951fff787af700f04c3315be4c0d7ad948e4ef011bd"

echo "fetch-mock-mods: all mods verified"
