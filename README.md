<div align="center">

# HATS
### Home Assistant Theme Store
*(a play on words, like HACS)* 🎩

**The Interactive Visual Designer, Community Store, and Generator for Home Assistant Themes**

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=flat-square)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.11%2B-41BDF5.svg?style=flat-square)](https://www.home-assistant.io)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

</div>

---

## Overview

**HATS** (**H**ome **A**ssistant **T**heme **S**tore) is a visual design application and community platform built to work in parallel with the **Home Assistant Ultimate Themes** pack.

It allows creators to visually build themes, upload backgrounds, design custom SVG overlays, write live-injected CSS, preview realistic Lovelace dashboards with true glassmorphism, and **submit themes directly as GitHub Pull Requests to the official theme repository**.

---

## Features

- **Live Lovelace Sandbox**: Real-time simulated Home Assistant dashboard featuring Mushroom-style cards, climate sliders, weather widgets, media controls, and status chips.
- **Physical Glass Engine**: Real `backdrop-filter`, specular rim sheens, ambient lighting, customizable corner radii (`8px`–`48px`), and border glows.
- **Background & Artwork Studio**: Upload any image (PNG, JPG, WebP), automatic 16:9 center-crop, darkening controls for card readability, and automatic dominant/average color extraction.
- **Custom SVG & Vector Patterns**: In-app generative SVG overlays (kids storybook stars, clouds, synthwave grids, tech circuits) or paste your own raw SVG code.
- **Custom CSS Injections**: Write custom `card-mod` rules, keyframe animations, and custom web fonts (e.g. Google Fonts) with instant live preview.
- **Theme Registry & Management**: Browse presets (Liquid Glass, Kids Playful, Velvet Matte, Neon Cyberpunk), duplicate, customize, or import existing YAML themes.
- **In-App GitHub Pull Request Engine**: Package and submit new themes directly to `HomeRiz/hats` via GitHub API.
- **Community Governance**: Upvote/downvote proposed themes and participate in theme lifecycle management (additions and community pruning).
- **1-Click Home Assistant Export**: Generate clean, fully compliant `theme.yaml` and per-view `card_mod` YAML snippets.

---

## Quick Start

```bash
cd hats
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
