# Changelog

## [1.1.7] - 2026-09-22
- **Base64 SVG Pattern Data URIs**: Encoded custom vector overlays and pattern presets (like Kids Stars & Clouds) using Base64 to prevent CSS parsing breakages.
- **Fixed Viewport & Lovelace Backdrop**: Added `:host::before` & `:host::after` viewport backdrops to `card-mod-root` and `hui-view::before` in `card-mod-view`.
- **Frosted Glass Sidebar Theming**: Sidebar now inherits translucent backgrounds (`sidebar-background-color`) and `card-mod-sidebar` backdrop blur.
- **Panel & Config Theming**: Added `card-mod-config` and `card-mod-panel-custom` to preserve seamless backdrops across settings, HACS, and drawer panels.

## [1.1.6] - 2026-09-22
- **Port Update**: Configured internal Ingress service port to `4287`.

## [1.0.5] - 2026-09-22
- **Ingress Relative Base**: Added `base: './'` to Vite configuration for seamless dynamic Ingress subpath resolution across all Home Assistant access URLs.
- **Dynamic API Bridge**: Updated frontend `haService` to resolve `/config/themes` API endpoints dynamically relative to the active Ingress token session.

## [1.0.4] - 2026-09-22
- **Tini Process Management**: Configured subreaper handling to prevent zombie processes and ensure clean shutdown.

## [1.0.3] - 2026-09-22
- **Multi-Stage Build Pipeline**: Modernized `Dockerfile` with multi-stage build (`node:20-alpine`) for lightning-fast compilation, reduced image footprint, and zero dependency issues during installation.

## [1.0.0] - 2026-09-22
### Initial Release of HATS (Home Assistant Theme Store)
- **Home Assistant Ingress Add-on**: Full sidebar integration with seamless authentication.
- **Visual Theme Designer**: Interactive editor for card geometry, blur character, specular sheens, and token generation.
- **Live Lovelace Sandbox**: Simulated cards, climate controls, weather widgets, Mushroom-style cards, and status chips.
- **Children's & Playful Theme**: Bubbly rounded cards, soft candy palette, and storybook glows.
- **1-Click Theme Installation**: Direct write to `/config/themes/*.yaml` with automatic `frontend.reload_themes` trigger.
- **Background & Vector Studio**: Image upload, smart 16:9 crop, darkening slider, and auto-palette color extraction.
- **In-App GitHub PR Hub**: Package and submit themes directly to the official community pack.
- **Community Governance**: Upvote and vote on themes for official inclusion or retirement.
