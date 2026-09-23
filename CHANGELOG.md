# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-23

### 🚀 Added
- **Initial Public Release** of HATS (Home Assistant Theme Store).
- **Lovelace Visual Sandbox**: Live interactive preview of Mushroom cards, Tile cards, weather cards, thermostats, media players, and custom sidebars with full glassmorphism and real-time backdrop blur.
- **1-Click Direct Theme Installer**: Deploys theme definitions directly to `/config/themes/<theme_id>.yaml` and automatically reloads Home Assistant themes via Supervisor Core API.
- **Artwork & Wallpaper Studio**: In-app image uploader with automatic 16:9 center-crop, WebP compression, and direct saving to `/config/www/hats/backgrounds/<theme_id>/default.webp`.
- **HATS Signature Theme Collection**: 14 curated built-in themes spanning Glass, Neon, Cyberpunk, Velvet, Art Deco, and Cottagecore visual languages.
- **Environment & Prerequisites Doctor**: Automated diagnostics detecting missing `frontend:` or `themes:` directives in `configuration.yaml`, verifying `card-mod` installation status, and providing 1-click automated repairs with timestamped safety backups (`configuration.yaml.hats_bak_<timestamp>`).
- **SVG Vector Pattern Engine**: Built-in support for procedural background overlays and base64 SVG pattern injection.
- **In-App Theme Submission Assistant**: Validates and packages custom themes with automated YAML generation, ready to submit to the official repository.
- **Copyleft Licensing**: Fully licensed under [GNU General Public License v3.0](LICENSE) guaranteeing perpetual open-source freedom.

### 🛡️ Security
- **Path Traversal Protection**: Enforced strict `cleanThemeId` whitelisting (`[a-z0-9_-]`) preventing directory breakout across theme generation, wallpaper uploads, and deletion endpoints.
- **YAML Injection Remediation**: Stripped newline and carriage return control characters from `extra_module_url` and resource path inputs.
- **SVG & XSS Neutralization**: Stripped `<script>`, `<foreignObject>`, and inline `on*` event handlers from vector overlays.
- **Click-Trap & Pointer-Freeze Guards**: Automatically neutralized rogue `:host::before` and `:host::after` fixed overlays by injecting `pointer-events: none !important;`.
- **Supervisor API Resilience**: Added `AbortSignal.timeout(10000)` across all Supervisor `fetch` requests to prevent resource starvation during Core restarts.
- **Memory Protection**: Express body parser bounded to 25MB to prevent memory exhaustion on resource-constrained Home Assistant hardware.

### 🔄 Changed
- Synchronized all release manifests (`package.json`, `package-lock.json`, `config.yaml`) to `1.0.0`.
- Documented Home Assistant Ingress authentication boundaries vs. optional unauthenticated direct LAN port `4287`.
