#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/vendor/mock-mods"

command -v curl >/dev/null || { echo "fetch-mock-mods: curl is required" >&2; exit 1; }
command -v shasum >/dev/null || command -v sha256sum >/dev/null || { echo "fetch-mock-mods: shasum or sha256sum is required" >&2; exit 1; }

mkdir -p "$DEST_DIR"

slug="card-mod"
download_url="https://raw.githubusercontent.com/thomasloven/lovelace-card-mod/v4.2.1/card-mod.js"
expected_sha256="5e7e71ad61796f59070f8c4621e69fa8e71a9864d0be0922bc4dbc72f990cd35"
dest_file="$DEST_DIR/${slug}.js"

if [ -f "$dest_file" ]; then
  if command -v shasum >/dev/null; then
    actual_sha256="$(shasum -a 256 "$dest_file" | cut -d' ' -f1)"
  else
    actual_sha256="$(sha256sum "$dest_file" | cut -d' ' -f1)"
  fi
  if [ "$actual_sha256" = "$expected_sha256" ]; then
    echo "fetch-mock-mods: $slug already present and verified, skipping"
  else
    echo "fetch-mock-mods: $slug exists but checksum mismatch, re-downloading"
    rm -f "$dest_file"
    tmp_file="$(mktemp -t hats-mock-mod-XXXXXX.js)" || tmp_file="/tmp/hats-mock-mod-$RANDOM.js"
    if ! curl -fsSL -o "$tmp_file" "$download_url"; then
      echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    if command -v shasum >/dev/null; then
      actual_sha256="$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)"
    else
      actual_sha256="$(sha256sum "$tmp_file" | cut -d' ' -f1)"
    fi
    if [ "$actual_sha256" != "$expected_sha256" ]; then
      echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
      echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    mv "$tmp_file" "$dest_file"
    echo "fetch-mock-mods: verified and installed $slug"
  fi
else
  echo "fetch-mock-mods: downloading $slug..."
  tmp_file="$(mktemp -t hats-mock-mod-XXXXXX.js)" || tmp_file="/tmp/hats-mock-mod-$RANDOM.js"
  if ! curl -fsSL -o "$tmp_file" "$download_url"; then
    echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  if command -v shasum >/dev/null; then
    actual_sha256="$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)"
  else
    actual_sha256="$(sha256sum "$tmp_file" | cut -d' ' -f1)"
  fi
  if [ "$actual_sha256" != "$expected_sha256" ]; then
    echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
    echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  mv "$tmp_file" "$dest_file"
  echo "fetch-mock-mods: verified and installed $slug"
fi

slug="bubble-card"
download_url="https://raw.githubusercontent.com/Clooos/Bubble-Card/v3.4.1/dist/bubble-card.js"
expected_sha256="b96ef3c279a574c1cbd66b23c7efd6bfb0c4817bf094c1c37f4426e403080cfb"
dest_file="$DEST_DIR/${slug}.js"

if [ -f "$dest_file" ]; then
  if command -v shasum >/dev/null; then
    actual_sha256="$(shasum -a 256 "$dest_file" | cut -d' ' -f1)"
  else
    actual_sha256="$(sha256sum "$dest_file" | cut -d' ' -f1)"
  fi
  if [ "$actual_sha256" = "$expected_sha256" ]; then
    echo "fetch-mock-mods: $slug already present and verified, skipping"
  else
    echo "fetch-mock-mods: $slug exists but checksum mismatch, re-downloading"
    rm -f "$dest_file"
    tmp_file="$(mktemp -t hats-mock-mod-XXXXXX.js)" || tmp_file="/tmp/hats-mock-mod-$RANDOM.js"
    if ! curl -fsSL -o "$tmp_file" "$download_url"; then
      echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    if command -v shasum >/dev/null; then
      actual_sha256="$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)"
    else
      actual_sha256="$(sha256sum "$tmp_file" | cut -d' ' -f1)"
    fi
    if [ "$actual_sha256" != "$expected_sha256" ]; then
      echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
      echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    mv "$tmp_file" "$dest_file"
    echo "fetch-mock-mods: verified and installed $slug"
  fi
else
  echo "fetch-mock-mods: downloading $slug..."
  tmp_file="$(mktemp -t hats-mock-mod-XXXXXX.js)" || tmp_file="/tmp/hats-mock-mod-$RANDOM.js"
  if ! curl -fsSL -o "$tmp_file" "$download_url"; then
    echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  if command -v shasum >/dev/null; then
    actual_sha256="$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)"
  else
    actual_sha256="$(sha256sum "$tmp_file" | cut -d' ' -f1)"
  fi
  if [ "$actual_sha256" != "$expected_sha256" ]; then
    echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
    echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  mv "$tmp_file" "$dest_file"
  echo "fetch-mock-mods: verified and installed $slug"
fi

slug="mushroom-cards"
download_url="https://github.com/piitaya/lovelace-mushroom/releases/download/v5.2.3/mushroom.js"
expected_sha256="631668268e474d5357e0f17f161322499ea5c93a910431477e112653d7aa456b"
dest_file="$DEST_DIR/${slug}.js"

if [ -f "$dest_file" ]; then
  if command -v shasum >/dev/null; then
    actual_sha256="$(shasum -a 256 "$dest_file" | cut -d' ' -f1)"
  else
    actual_sha256="$(sha256sum "$dest_file" | cut -d' ' -f1)"
  fi
  if [ "$actual_sha256" = "$expected_sha256" ]; then
    echo "fetch-mock-mods: $slug already present and verified, skipping"
  else
    echo "fetch-mock-mods: $slug exists but checksum mismatch, re-downloading"
    rm -f "$dest_file"
    tmp_file="$(mktemp -t hats-mock-mod-XXXXXX.js)" || tmp_file="/tmp/hats-mock-mod-$RANDOM.js"
    if ! curl -fsSL -o "$tmp_file" "$download_url"; then
      echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    if command -v shasum >/dev/null; then
      actual_sha256="$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)"
    else
      actual_sha256="$(sha256sum "$tmp_file" | cut -d' ' -f1)"
    fi
    if [ "$actual_sha256" != "$expected_sha256" ]; then
      echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
      echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    mv "$tmp_file" "$dest_file"
    echo "fetch-mock-mods: verified and installed $slug"
  fi
else
  echo "fetch-mock-mods: downloading $slug..."
  tmp_file="$(mktemp -t hats-mock-mod-XXXXXX.js)" || tmp_file="/tmp/hats-mock-mod-$RANDOM.js"
  if ! curl -fsSL -o "$tmp_file" "$download_url"; then
    echo "fetch-mock-mods: FAILED to download $slug from $download_url" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  if command -v shasum >/dev/null; then
    actual_sha256="$(shasum -a 256 "$tmp_file" | cut -d' ' -f1)"
  else
    actual_sha256="$(sha256sum "$tmp_file" | cut -d' ' -f1)"
  fi
  if [ "$actual_sha256" != "$expected_sha256" ]; then
    echo "fetch-mock-mods: SHA-256 mismatch for $slug" >&2
    echo "fetch-mock-mods: expected $expected_sha256, got $actual_sha256" >&2
    rm -f "$tmp_file"
    exit 1
  fi
  mv "$tmp_file" "$dest_file"
  echo "fetch-mock-mods: verified and installed $slug"
fi

echo "fetch-mock-mods: all mods verified"
