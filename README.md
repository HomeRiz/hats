<div align="center">

<img src="logo.svg" width="340" alt="HATS - Home Assistant Theme Store Logo" />

<br/>

**The Interactive Visual Designer, Community Store, Live Lovelace Sandbox, and Generator for Home Assistant Themes**

[![Home Assistant Add-on](https://img.shields.io/badge/Home%20Assistant-Add--on-41BDF5.svg?style=flat-square&logo=home-assistant)](https://www.home-assistant.io)
[![Ingress Support](https://img.shields.io/badge/Ingress-Ready-success.svg?style=flat-square)](https://www.home-assistant.io/addons/)
[![HACS Companion](https://img.shields.io/badge/HACS-Companion-orange.svg?style=flat-square)](https://hacs.xyz)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

[Installation](#-installation) • [Features](#-features) • [Environment Doctor](#-environment--prerequisites-doctor) • [Configuration](#-configuration) • [Development](#-standalone-developer-mode)

</div>

---

## 📖 Overview

**HATS** (**H**ome **A**ssistant **T**heme **S**tore) is an all-in-one Home Assistant Add-on and visual theme studio designed to simplify theme discovery, visual customization, and environment configuration.

Operating seamlessly through Home Assistant **Ingress** or as a dedicated full-window Web UI, HATS connects directly to your Home Assistant instance to inspect prerequisites, auto-configure theme directories, download companion card dependencies via HACS, and apply custom glassmorphism themes with zero manual YAML editing required.

---

## ✨ Features

- 🎨 **Visual Theme Designer**: Real-time CSS and YAML generator with color pickers, specular highlights, border glows, ambient lighting, and corner radius sliders (`8px`–`48px`).
- 🔬 **Live Lovelace Sandbox**: Interactive dashboard preview featuring simulated Mushroom cards, climate sliders, weather widgets, media controls, and status chips.
- 🩺 **HA Environment & Prerequisites Doctor**:
  - Live inspection of `configuration.yaml` for theme directives (`themes: !include_dir_merge_named themes`).
  - Automatic detection of `lovelace-card-mod` on disk (`/config/www/community/lovelace-card-mod`).
  - Dynamic extraction of live `hacstag` version identifiers directly from HA storage.
  - **1-Click Auto-Fix**: Automatically backs up and injects missing theme directives and `extra_module_url` references.
- 📦 **1-Click Direct Theme Installer**: Writes generated theme definitions directly to `/config/themes/` and automatically triggers Home Assistant's `frontend.reload_themes` service.
- 🖼️ **Artwork & Background Studio**: Upload custom wallpapers (PNG, JPG, WebP), perform automatic 16:9 center crops, and save assets directly to `/config/www/hats/backgrounds/`.
- 🌐 **Pop-Out Fullscreen Mode**: Launch HATS in a full dedicated browser tab (<kbd>↗</kbd>) or access directly via container port `4287` for maximum workspace real estate.
- 🚀 **In-App GitHub Pull Request Engine**: Package and propose new themes directly to the official theme repository with a single click.

---

## 🚀 Installation

### As a Home Assistant Add-on (Recommended)

1. In Home Assistant, navigate to **Settings** → **Add-ons** → **Add-on Store**.
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

### How the Doctor Streamlines Setup:
- **Missing Plugin**: HATS displays a direct **"Install via HACS"** button opening `http://<ha-host>:8123/hacs/repository/190927524`.
- **Plugin Detected on Disk**: The **HA Setup** badge in the navbar pulses amber with an alert.
- **1-Click Auto-Fix**: Clicking **Auto-Fix YAML Bridge** reads the exact `hacstag` from your HA storage, creates a safety backup (`configuration.yaml.hats_bak_<timestamp>`), and injects the required configuration automatically.

---

## ⚙️ Configuration

The add-on works out-of-the-box with default options, but can be customized in the **Configuration** tab:

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

## 🏗️ Add-on Container Architecture & `run.sh`

HATS is packaged as an official Home Assistant Ingress Add-on built from a multi-stage Docker image:

- **`Dockerfile`**: Builds the React + TypeScript single-page application and bundles it with a lightweight Express backend running on Node 20.
- **`run.sh`**: The mandatory container startup entrypoint. When Home Assistant Supervisor starts the container:
  - **I.** Ensures `/config/themes` exists on the host filesystem.
  - **II.** Ensures `/config/www/hats/backgrounds` exists on the host filesystem.
  - **III.** Launches the Ingress server (`exec node server/index.js`) on port `4287`.
- **`config.yaml`**: Home Assistant add-on manifest specifying Ingress routes, permissions (`manager` role to reload themes and manage storage), options, and architecture compatibility.
- **`repository.yaml`**: Home Assistant add-on repository descriptor.

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

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

