# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-03

### Added

- The Submit PR button is now Send PR / Issue. Besides sending a theme as a
  pull request, the same dialog can open an issue on the HATS repository to
  report a bug with a theme or to ask for a theme to be removed.
- The live preview now has a view for each supported custom card: Mushroom,
  Bubble Card, Layout Card, Button Card, Stack-in-Card and card-mod, each with
  demo entities, so you can see how a theme looks on them before installing.
- A new Cards tab in the designer turns theme support on or off for each of
  those cards. Turned on, the theme sets that card's own variables (Mushroom,
  Bubble Card, Layout Card, Button Card) and lists it as a requirement.
- The Custom Components list now includes Button Card and Stack-in-Card.
- An intensity slider for the Cyber Scanlines Overlay.

### Changed

- The add, search and edit buttons in the live preview header are greyed out
  and do nothing, and the search and command keyboard shortcuts are blocked,
  so the preview cannot be used to change anything.
- The Setup Needed button in the top bar only appears when something is missing
  or misconfigured in Home Assistant (HACS, the card-mod entry or the themes
  folder setting). The HA Doctor button stays on the Themes page.
- On the Themes page the whole page scrolls with the mouse wheel, not just the
  narrow strip with the scroll bar, and the title, buttons, search box and
  filters stay in place at the top while you scroll.

### Fixed

- The Cyber Scanlines Overlay switch did nothing. It now draws the CRT
  scanlines over the dashboard. It needs card-mod.
- Three of the four ready-made Custom CSS snippets did nothing and now work:
  the neon pulse animates a glow instead of a shadow the theme overrides, the
  font snippet uses rounded system fonts instead of a web font that cannot load
  inside a card, and the frosted glass snippet now targets every card.
- The theme list in the top bar slid under the live preview.

## [1.0.0] - 2026-10-02

First public release of HATS, the Home Assistant Theme Store.

### Added

- Visual theme designer with palettes, SVG patterns, artwork presets, custom
  CSS, glass and sidebar controls, and a background studio (upload, crop,
  darken and palette extraction).
- Theme library with 21 original themes, 95 community themes and 7 built-in
  themes. Themes from the same author are grouped into packs.
- Pack browsing: the arrow keys and the side arrows step through the variants
  of a pack and carry on into the next pack.
- Import from any public GitHub repository or raw YAML link. A repository
  with several themes is imported as one pack.
- Three Kids themes with picture backgrounds (Storybook Village, Space
  Adventure and Forest Friends), next to Playful Wonder.
- Live preview that runs the real Home Assistant frontend against a built-in
  demo backend, with card-mod, Bubble Card and Mushroom Cards loaded. Light
  themes are previewed with light colours.
- One-click install to `/config/themes` with an automatic theme reload,
  uninstall and batch install. Wallpapers, including the ones bundled with
  the built-in themes, are uploaded to Home Assistant.
- Pull request submission to the official themes repository using an optional
  GitHub token.
- Environment doctor that detects card-mod, Bubble Card and HACS and can fix
  `configuration.yaml` for you.
- Theme requirement detection and a Custom Components tab.
- HATS Signature Nature - Alpine Storm Lake as the default theme, with the
  lake photo built in so it works offline.
- Keyboard focus rings and reduced-motion support.
- PNG app icon and logo.
- GitHub Actions workflow that typechecks, tests, builds, lints the app
  configuration and builds the Docker image.

### Changed

- The app is reachable through Ingress only.
- Code-split the Themes and Community tabs, the Designer sub-tabs and the
  on-demand modals to reduce the initial bundle.
- Upgraded to React 19, Vite 8, Tailwind CSS 4, TypeScript 7, Express 5 and
  js-yaml 5.

### Security

- Ingress-only authentication, CSRF protection and an allow-list for card-mod
  URLs.
- Allow-listed theme values, DOMPurify sanitising of SVG overlays and
  server-side defence for custom CSS.
- Path traversal protection in theme handling and the mock frontend routes.
- The live-render preview runs with an in-memory storage shim, so it cannot
  touch your real Home Assistant session.
