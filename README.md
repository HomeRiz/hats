<div align="center">

<img src="logo.svg" width="340" alt="HATS - Home Assistant Theme Store Logo" />

<br/>

**The Interactive Visual Designer, Community Store, Live Lovelace Sandbox, and Generator for Home Assistant Themes**

[![Home Assistant App](https://img.shields.io/badge/Home%20Assistant-App-41BDF5.svg?style=flat-square&logo=home-assistant)](https://www.home-assistant.io)
[![Ingress Support](https://img.shields.io/badge/Ingress-Ready-success.svg?style=flat-square)](https://www.home-assistant.io/apps/)
[![HACS Companion](https://img.shields.io/badge/HACS-Companion-orange.svg?style=flat-square)](https://hacs.xyz)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](LICENSE)

[Installation](#-installation) • [Features](#-features) • [Environment Doctor](#-environment--prerequisites-doctor) • [Configuration](#-configuration) • [Development](#-standalone-developer-mode)

</div>

---

## 📖 Overview

**HATS** (**H**ome **A**ssistant **T**heme **S**tore) is an all-in-one Home Assistant App and visual theme studio designed to simplify theme discovery, visual customization, and environment configuration.

Operating seamlessly through Home Assistant **Ingress** or as a dedicated full-window Web UI, HATS connects directly to your Home Assistant instance to inspect prerequisites, auto-configure theme directories, download companion card dependencies via HACS, and apply custom glassmorphism themes with zero manual YAML editing required.

---

## ✨ Features

- 🎨 **Visual Theme Designer**: Real-time CSS and YAML generator with color pickers, specular highlights, border glows, ambient lighting, and corner radius sliders (`8px`–`48px`).
- 🔬 **Live Lovelace Sandbox**: Interactive dashboard preview featuring simulated Mushroom cards, climate sliders, weather widgets, media controls, and status chips.
- 🩺 **HA Environment & Prerequisites Doctor**:
  - Live inspection of `configuration.yaml` for theme directives (`themes: !include_dir_merge_named themes`).
  - Automatic detection of `lovelace-card-mod` on disk (`/config/www/community/lovelace-card-mod`) or of [UIX](https://github.com/Lint-Free-Technology/uix) set up as an integration, with a **UIX / card-mod switch** to choose which one HATS checks and configures.
  - Dynamic extraction of live `hacstag` version identifiers directly from HA storage.
  - **1-Click Auto-Fix**: Automatically backs up and injects missing theme directives and `extra_module_url` references.
- 📦 **1-Click Direct Theme Installer**: Writes generated theme definitions directly to `/config/themes/` and automatically triggers Home Assistant's `frontend.reload_themes` service.
- 🗜️ **Zip export and Import**: **Export > Download .zip** gives you the theme YAML and its background image already placed in the folders Home Assistant expects (`config/themes`, `config/www/hats/backgrounds/<theme>`), an optional per-view snippet and a README with the manual install steps. **Import** loads a theme YAML, plus an optional background image and per-view snippet.
- 🖼️ **Artwork & Background Studio**: Upload custom wallpapers (PNG, JPG, WebP), perform automatic 16:9 center crops, and save assets directly to `/config/www/hats/backgrounds/`.
- 🌐 **Pop-Out Fullscreen Mode**: Launch HATS in a full dedicated browser tab (<kbd>↗</kbd>) through Ingress. HATS is reachable only through Home Assistant Ingress (admin users); it publishes no host port and refuses direct network access.
- 🚀 **In-App GitHub Theme Submission**: Validate, package, and generate YAML for custom themes with one-click links to propose additions to the official repository.

---

## 🚀 Installation

### As a Home Assistant App (Recommended)

1. In Home Assistant, go to **Settings** → **Apps** and click **Install app** to open the **App store**.
2. Click the top-right menu (**⋮**) and select **Repositories**.
3. Add the repository URL:
   ```text
   https://github.com/HomeRiz/hats
   ```
4. Locate **HATS - Home Assistant Theme Store** in the store list and click **Install**.
5. Enable **Show in sidebar** and click **Start**.
6. Open **HATS** from your Home Assistant sidebar! 🎩

---

## 🩺 Environment & Prerequisites Doctor

Modern Home Assistant themes (such as those in the HATS Signature Collection) require two core configuration elements: the themes merge directory directive and the `lovelace-card-mod` custom module registration.

In Home Assistant's `configuration.yaml`, the root `frontend:` key must only appear once. Both elements must be merged together under this single `frontend:` block:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /hacsfiles/lovelace-card-mod/card-mod.js?hacstag=...
```

### UIX or card-mod

HATS supports both [UIX](https://github.com/Lint-Free-Technology/uix) and card-mod. They read the same `card-mod-*` theme keys, so every HATS theme works with either. Use the **Styling Engine** switch in the Doctor to choose the one you use, and HATS will check and configure that one:

- **UIX**: installed as an integration (HACS, then Settings, Devices & services, Add integration). It loads itself, so no `extra_module_url` entry is needed and Auto-Fix only adds the themes directive.
- **card-mod**: the setup above, with `extra_module_url` registered in `configuration.yaml`.

Only one can run at a time. UIX's migration guide says to uninstall card-mod first, and HATS warns if both are active. When you switch to UIX, **Remove card-mod from config** takes the entry out of `configuration.yaml` (with a backup); you still uninstall card-mod in HACS and restart Home Assistant yourself.

### How the Doctor Streamlines Setup:
- **Missing Plugin**: HATS displays a direct **"Install via HACS"** button opening `http://<ha-host>:8123/hacs/repository/190927524`.
- **Plugin Detected on Disk**: The **HA Setup** badge in the navbar pulses amber with an alert.
- **1-Click Auto-Fix**: Clicking **Auto-Fix YAML Bridge** reads the exact `hacstag` from your HA storage, creates a safety backup (`configuration.yaml.hats_bak_<timestamp>`), and injects the required configuration automatically.

---

## ⚙️ Configuration

The app works out-of-the-box with default options, but can be customized in the **Configuration** tab:

```yaml
themes_directory: "/config/themes"
backgrounds_directory: "/config/www/hats/backgrounds"
auto_reload_themes: true
```

| Option | Type | Default | Description |
|---|---|---|---|
| `themes_directory` | string | `/config/themes` | Target path where generated theme YAML files are stored. |
| `backgrounds_directory` | string | `/config/www/hats/backgrounds` | Target path where uploaded wallpaper artwork is saved. |
| `auto_reload_themes` | boolean | `true` | Automatically calls `frontend.reload_themes` upon applying a theme. |

---

## 🏗️ App Container Architecture & `run.sh`

HATS is packaged as a Home Assistant Ingress App built from a multi-stage Docker image:

- **`Dockerfile`**: Builds the React + TypeScript single-page application and bundles it with a lightweight Express backend running on Node 20.
- **`run.sh`**: The mandatory container startup entrypoint. When Home Assistant Supervisor starts the container:
  - **I.** Ensures `/config/themes` exists on the host filesystem.
  - **II.** Ensures `/config/www/hats/backgrounds` exists on the host filesystem.
  - **III.** Launches the Ingress server (`exec node server/index.js`) on port `4287`.
- **`config.yaml`**: Home Assistant app manifest specifying the Ingress route, permissions (Home Assistant API access to reload themes), the `/config` mapping, options, and architecture compatibility.
- **`repository.yaml`**: Home Assistant app repository descriptor.

---

## 🖥️ Standalone Developer Mode

For local UI development without a full Home Assistant supervisor:

```bash
# Clone the repository
git clone https://github.com/HomeRiz/hats.git
cd hats

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:4287](http://localhost:4287) in your browser.

---

## 💻 Desktop App (Windows, Linux, macOS)

The same code also builds as a normal desktop app, so you can design themes without Home Assistant. It runs the same server and live preview locally (on `127.0.0.1` only), with the card-mod, Bubble Card, Mushroom, Layout Card, Button Card and Stack-in-Card preview mods bundled.

What changes compared to the Home Assistant app:
- Nothing is installed into Home Assistant. When a theme is ready, use **Export > Copy** or **Export > Download .zip**. The zip holds the theme and its background image in the folders Home Assistant expects, plus a README with the install steps.
- The HA Doctor, HACS checks and the UIX / card-mod switch are hidden, since they only make sense inside Home Assistant.

Build it yourself:

```bash
npm install
npm run dist:mac     # macOS: Apple silicon + Intel (.dmg, .zip)
npm run dist:win     # Windows x64 (installer + portable .exe)
npm run dist:linux   # Linux x64 (.AppImage, .deb)
```

Output goes to `release/`. Build each target on its own OS (the **Desktop builds** workflow does this for all three). To try it without packaging, run `npm run desktop:prepare` once and then `npm run electron:dev`.

The builds are not code signed, so macOS and Windows show a warning on first launch (macOS: right-click the app and choose Open; Windows: More info, Run anyway).

---

## 🔎 Preview-only site (no install, no access to your Home Assistant)

The same code also builds as a static website that previews any public GitHub theme repo, exactly as its author published it, inside the real Home Assistant frontend. It has no server, no access to `/config`, and no token, so there is nothing to install or trust. It is the lightweight way to see a theme before downloading it from HACS.

Open it with a link:

```
https://<site>/?repo=OWNER/REPO
https://<site>/?repo=OWNER/REPO&theme=Theme%20Name
https://<site>/?repo=OWNER/REPO&branch=dev&theme=Theme%20Name
```

- `repo` is `owner/repo` or a `github.com` / `raw.githubusercontent.com` link. Other hosts are ignored.
- `theme` picks one theme from a repo that has several (by name or id). Without it, the first one is shown.
- Images the theme loads from `/local/...` are found in the repo and loaded from there when the repo contains them.
- It also works inside the Home Assistant app and the desktop app with the same links.

A theme author can put a badge in their README (HACS shows READMEs):

```markdown
[![Preview in HATS](https://img.shields.io/badge/Preview-HATS-0A84FF)](https://<site>/?repo=OWNER/REPO)
```

Build it yourself with `npm run build:hosted` (output in `hosted-dist/`, about 180 MB). Set `HATS_BASE_PATH=/name` if it is served from a subfolder. The **Preview site** workflow deploys it to GitHub Pages: enable Pages with source **GitHub Actions** in the repository settings, then run the workflow.

Limits: GitHub allows 60 unauthenticated API requests per hour per IP, so a busy network can hit a rate limit (it then tries the usual `themes/<repo>.yaml` locations). Themes that need a card or integration you don't have installed will look different in a real Home Assistant, as they do anywhere else.

---

## 📄 License

Distributed under the GNU General Public License v3.0 (GPL-3.0). The license text is the unmodified GPLv3. See [LICENSE](LICENSE). Copyright (C) 2026 HomeRiz and HATS Contributors. The project's intent is to stay free and community-driven; the GPL itself guarantees that derivative works stay open.

