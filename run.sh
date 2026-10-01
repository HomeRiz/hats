#!/usr/bin/env bash
set -e

echo "[INFO] Starting HATS (Home Assistant Theme Store)..."

if [ ! -d "/config/themes" ]; then
    echo "[INFO] Creating /config/themes directory..."
    mkdir -p /config/themes
fi

if [ ! -d "/config/www/hats/backgrounds" ]; then
    echo "[INFO] Creating /config/www/hats/backgrounds directory..."
    mkdir -p /config/www/hats/backgrounds
fi

cd /app

export HATS_ENABLE_LIVE_PREVIEW=true

echo "[INFO] Launching HATS Ingress Server on port 4287..."
exec node server/index.js
