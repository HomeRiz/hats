# Changelog

## [1.2.0] - 2026-09-22
- **New Theme Apply Flow & User Profile Direct Link**: When installing a new theme to Home Assistant, HATS immediately provides a 1-click link to open the Home Assistant User Profile (`/profile`) with instructions and 1-click theme name copy for effortless theme activation.
- **Modified Theme Reload & HA Restart Suite**: When saving changes to an already installed/active theme, HATS displays dedicated quick actions: **Reload Themes** (`frontend.reload_themes`), **Refresh Lovelace**, and **Restart Home Assistant Core** (`/api/ha/restart` with safety confirmation).
- **Editor Quick-Save Action**: Added a direct "Save to HA" / "Install to HA" button in the Designer header for faster iteration without leaving the editor.

## [1.1.9] - 2026-09-22
- **HA Theme Discovery & Live Sync**: Automatically scans and parses all installed themes in `/config/themes/` (including nested folders like `ultimate-theme/`), making all existing HA themes editable, duplicable, and manageable directly within HATS.
- **Corrupt Theme Prevention & Auto-Repair**: Integrated server-side YAML syntax validation (`js-yaml`) and sanitization to prevent Home Assistant recovery mode errors caused by unescaped background URLs or invalid scalar quotes.
- **Base64 SVG Pattern Overlays**: Guaranteed reliable SVG pattern rendering for themes like Kids Playful Stars & Clouds across all dashboards.
- **Sync from HA Action**: Added a direct "Sync from HA" action and an "Installed" category filter with dynamic theme counts in the Theme Registry.

## [1.1.8] - 2026-09-22
- **Companion Card Badges in Theme Gallery**: Added interactive requirement and recommendation badges for **Mushroom**, **Bubble Card**, and **Layout Card** across all themes.
- **Citrine-Grade System Tokens**: Integrated Web-Awesome dropdown variables, full dialog and top app bar card-mod directives, and scrollbars.
- **Corrupt Theme Safeguard**: Eliminated YAML scalar parse errors in custom backgrounds.

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
