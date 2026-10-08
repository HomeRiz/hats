<div align="center">

<img src="logo.svg" width="340" alt="HATS - Home Assistant Theme Store" />

<br/>

**A visual designer, live preview and installer for Home Assistant themes**

[![Live preview](https://img.shields.io/badge/Live%20preview-homeriz.github.io%2Fhats-0A84FF.svg?style=flat-square)](https://homeriz.github.io/hats/)
[![Home Assistant App](https://img.shields.io/badge/Home%20Assistant-App-41BDF5.svg?style=flat-square&logo=home-assistant)](https://www.home-assistant.io)
[![HACS Companion](https://img.shields.io/badge/HACS-Companion-orange.svg?style=flat-square)](https://hacs.xyz)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](LICENSE)

[Live preview](#live-preview) | [Installation](#installation) | [Features](#features) | [Theme colors and card mods](#theme-colors-and-card-mods) | [Environment Doctor](#environment-and-prerequisites-doctor) | [Configuration](#configuration) | [Development](#development)

</div>

---

## Overview

HATS (Home Assistant Theme Store) is a Home Assistant app and visual theme studio. It helps you find a theme, see it on a realistic dashboard, adjust it, and install it without editing YAML by hand.

It runs in three ways:

- **Home Assistant app**, through Ingress, connected to your own instance.
- **Desktop app** for Windows, macOS and Linux, with no Home Assistant needed.
- **Preview website**, a read-only page that previews any public GitHub theme repository.

---

## Live preview

Try HATS in your browser at **[homeriz.github.io/hats](https://homeriz.github.io/hats/)**. Nothing is installed and the page cannot reach your Home Assistant.

To preview a theme from any public GitHub repository, click **GitHub** in the top bar and paste the repository link, or open a link directly:

```text
https://homeriz.github.io/hats/?repo=OWNER/REPO
https://homeriz.github.io/hats/?repo=OWNER/REPO&theme=Theme%20Name
https://homeriz.github.io/hats/?repo=OWNER/REPO&branch=dev&theme=Theme%20Name
```

For example, [the iOS dark mode theme](https://homeriz.github.io/hats/?repo=basnijholt/lovelace-ios-dark-mode-theme) or [Stell Blue with Colors](https://homeriz.github.io/hats/?repo=home-assistant-community-themes/stell-blue-with-colors).

- `repo` is `owner/repo` or a `github.com` or `raw.githubusercontent.com` link. Other hosts are ignored.
- `theme` picks one theme from a repository that has several, by name or id. Without it the first one is shown.
- Wallpapers that a theme embeds as `data:image` or loads from `/local/...` are found and shown when the repository contains them.
- The page is read-only. It offers no import, create, duplicate or delete, and it does not keep the themes you open.
- HATS hosts none of the themes. It reads the files straight from the author's repository, so themes without a license are never copied or stored.

A theme author can add a badge to their README. HACS shows READMEs, so users can preview the theme before installing it:

```markdown
[![Preview in HATS](https://img.shields.io/badge/Preview-HATS-0A84FF)](https://homeriz.github.io/hats/?repo=OWNER/REPO)
```

GitHub allows 60 unauthenticated API requests per hour per IP address, so a busy network can reach a rate limit. HATS then tries the usual `themes/<repo>.yaml` locations.

---

## Theme colors and card mods

The preview shows a theme with the real Home Assistant frontend and the same card mods you would have installed: card-mod or UIX, Bubble Card, Mushroom, Button Card, Layout Card and Stack-in-Card.

A card mod only follows a theme if the theme has a setting for it. When a theme has no setting for a mod, **that mod falls back to its own hard-coded colors**, exactly as it does in Home Assistant. This is the most common reason a mod does not match the rest of a theme.

| Mod | What it uses when the theme sets nothing for it |
|---|---|
| Mushroom Cards | Orange for active lights, green for fans, blue for other entities |
| Button Card | The Home Assistant active state color, which is amber or orange |
| Bubble Card | A fixed bright blue |

To help previews look consistent, HATS fills in two colors when a theme does not set them:

- **Accent color and Bubble Card button color** use the theme's active state color (`state-icon-active-color`), then its primary color, then its accent color. A theme that sets its own `accent-color` or `bubble-accent-color` keeps it.
- **Card background** of a light theme that sets none becomes light, so text stays readable.

HATS does not change the colors of Mushroom Cards, Button Card or the meaning-carrying states (heating, locks, alarms). To make a mod match your theme, set the mod's own variables in the theme. For Mushroom Cards, for example, add `mush-rgb-state-light` and the other `mush-rgb-state-*` values to the theme file.

---

## Features

- **Visual theme designer.** Real-time CSS and YAML generation with color pickers, specular highlights, border glows, ambient lighting and corner radius sliders from `8px` to `48px`.
- **Live Lovelace preview.** A single Home page built from the real Home Assistant frontend, with an example of every supported card family.
- **Theme library.** Browse, select, preview and export the bundled HATS themes and any themes you create.
- **Browse HACS themes.** In the Community tab, search, sort and filter every theme repository in the HACS catalog, see its license and stars, and preview it in HATS.
- **Environment and prerequisites Doctor.** Inspects `configuration.yaml` for theme settings, detects [UIX](https://github.com/Lint-Free-Technology/uix) or `lovelace-card-mod`, reads the live `hacstag` from Home Assistant storage, and offers a one-click fix.
- **One-click installer.** Writes the theme to `/config/themes/` and calls `frontend.reload_themes`.
- **Zip export and import.** Download the theme, its background image and a per-view snippet in the folders Home Assistant expects, with a README of install steps. Import loads a theme YAML, an optional background image and a per-view snippet.
- **Artwork studio.** Upload wallpapers (PNG, JPG, WebP), crop them to 16:9 and save them to `/config/www/hats/backgrounds/`.
- **Pop-out mode.** Open HATS in its own browser tab through Ingress. It is reachable only through Home Assistant Ingress by admin users, and it publishes no host port.
- **GitHub submission.** Validate and package a theme, with links to propose it to the official repository.

---

## Installation

### Home Assistant app

1. In Home Assistant, open **Settings**, then **Apps**, and click **Install app** to open the app store.
2. Open the top-right menu and select **Repositories**.
3. Add the repository:

   ```text
   https://github.com/HomeRiz/hats
   ```

4. Find **HATS - Home Assistant Theme Store** in the store and click **Install**.
5. Turn on **Show in sidebar** and click **Start**.
6. Open **HATS** from the Home Assistant sidebar.

### Desktop app

Download the installer for your system from the [latest release](https://github.com/HomeRiz/hats/releases/latest):

| System | Files |
|---|---|
| macOS (Apple silicon and Intel) | `.dmg`, `.zip` |
| Windows (x64) | installer `.exe`, portable `.exe` |
| Linux (x64) | `.AppImage`, `.deb` |

The builds are not code signed, so macOS and Windows show a warning on first launch. On macOS, right-click the app and choose **Open**. On Windows, choose **More info**, then **Run anyway**.

---

## Desktop app

The desktop app runs the same server and live preview on your computer, listening on `127.0.0.1` only. The card-mod, Bubble Card, Mushroom, Layout Card, Button Card and Stack-in-Card preview mods are bundled.

Compared with the Home Assistant app:

- Nothing is installed into Home Assistant. When a theme is ready, use **Export > Copy** or **Export > Download .zip**.
- The Doctor, HACS checks and the UIX and card-mod switch are hidden, since they only apply inside Home Assistant.

To build it yourself:

```bash
npm install
npm run dist:mac     # macOS: Apple silicon and Intel (.dmg, .zip)
npm run dist:win     # Windows x64 (installer and portable .exe)
npm run dist:linux   # Linux x64 (.AppImage, .deb)
```

Output goes to `release/`. Build each target on its own operating system. The **Desktop builds** workflow does this for all three and attaches the files to the GitHub release when a version tag is pushed. To try the app without packaging, run `npm run desktop:prepare` once, then `npm run electron:dev`.

---

## Environment and prerequisites Doctor

Modern themes, such as the HATS Signature Collection, need two things in `configuration.yaml`: the themes directory directive and the card-mod (or UIX) module. The `frontend:` key may appear only once, so both go under it:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /hacsfiles/lovelace-card-mod/card-mod.js?hacstag=...
```

### UIX or card-mod

HATS supports [UIX](https://github.com/Lint-Free-Technology/uix) and card-mod. Both read the same `card-mod-*` theme keys, so every HATS theme works with either. Use the **Styling Engine** switch in the Doctor to choose the one you use.

- **UIX** is installed as an integration through HACS. It loads itself, so no `extra_module_url` entry is needed and Auto-Fix only adds the themes directive.
- **card-mod** needs `extra_module_url` registered in `configuration.yaml`, as shown above.

Only one can run at a time. The UIX migration guide says to uninstall card-mod first, and HATS warns if both are active. When you switch to UIX, **Remove card-mod from config** removes the entry from `configuration.yaml` after making a backup. You still uninstall card-mod in HACS and restart Home Assistant yourself.

### What the Doctor does

- **Missing plugin.** An **Install via HACS** button opens the plugin page in HACS.
- **Plugin found on disk.** The **HA Setup** badge in the top bar is highlighted.
- **Auto-Fix.** Reads the exact `hacstag` from Home Assistant storage, saves a backup (`configuration.yaml.hats_bak_<timestamp>`) and adds the required configuration.

---

## Configuration

HATS works with its defaults. You can change these options in the app's **Configuration** tab:

```yaml
themes_directory: "/config/themes"
backgrounds_directory: "/config/www/hats/backgrounds"
auto_reload_themes: true
```

| Option | Type | Default | Description |
|---|---|---|---|
| `themes_directory` | string | `/config/themes` | Where generated theme YAML files are stored. |
| `backgrounds_directory` | string | `/config/www/hats/backgrounds` | Where uploaded wallpapers are saved. |
| `auto_reload_themes` | boolean | `true` | Calls `frontend.reload_themes` after a theme is applied. |

---

## Development

For local work without a Home Assistant supervisor:

```bash
git clone https://github.com/HomeRiz/hats.git
cd hats
npm install
npm run dev
```

Open [http://localhost:4287](http://localhost:4287).

### App container

HATS is packaged as a Home Assistant Ingress app built from a multi-stage Docker image:

- **`Dockerfile`** builds the React and TypeScript application and bundles it with a small Express server on Node 26.
- **`run.sh`** is the container entrypoint. It creates `/config/themes` and `/config/www/hats/backgrounds` if they are missing, then starts the server (`node server/index.js`) on port `4287`.
- **`config.yaml`** is the app manifest: the Ingress route, the Home Assistant API permission used to reload themes, the `/config` mapping, the options and the supported architectures.
- **`repository.yaml`** describes the app repository.

### Preview site

The same code builds as a static website:

```bash
npm run build:hosted
```

The output is in `hosted-dist/` and is about 180 MB. Set `HATS_BASE_PATH=/name` if the site is served from a subfolder. The **Preview site** workflow deploys it to GitHub Pages. Enable Pages with the source set to **GitHub Actions** in the repository settings, then run the workflow.

### HACS theme index

The **HACS theme index** workflow runs daily. It reads the HACS theme catalog, records each repository's license, stars, last push and theme files, and publishes the result to the `hacs-index` branch, which the Browse HACS themes section reads.

---

## License

Distributed under the GNU General Public License v3.0. The license text is the unmodified GPLv3, see [LICENSE](LICENSE). Copyright (C) 2026 HomeRiz and HATS Contributors.
