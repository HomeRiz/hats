#!/usr/bin/with-contenv bashio

bashio::log.info "Starting HATS (Home Assistant Theme Store)..."

if [ ! -d "/config/themes" ]; then
    bashio::log.info "Creating /config/themes directory..."
    mkdir -p /config/themes
fi

if [ ! -d "/config/www/ultimate-theme/backgrounds" ]; then
    bashio::log.info "Creating /config/www/ultimate-theme/backgrounds directory..."
    mkdir -p /config/www/ultimate-theme/backgrounds
fi

cd /app

bashio::log.info "Launching HATS Ingress Server on port 8099..."
exec node server/index.js
