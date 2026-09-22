#!/usr/bin/env bash
set -e

echo "[INFO] Starting HATS (Home Assistant Theme Store)..."

if [ ! -d "/config/themes" ]; then
    echo "[INFO] Creating /config/themes directory..."
    mkdir -p /config/themes
fi

if [ ! -d "/config/www/ultimate-theme/backgrounds" ]; then
    echo "[INFO] Creating /config/www/ultimate-theme/backgrounds directory..."
    mkdir -p /config/www/ultimate-theme/backgrounds
fi

cd /app

echo "[INFO] Launching HATS Ingress Server on port 8099..."
exec node server/index.js
