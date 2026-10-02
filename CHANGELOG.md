# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-02

First public release of HATS, the Home Assistant Theme Store.

### Added

- Visual theme designer with palettes, SVG patterns, artwork presets, custom
  CSS, glass and sidebar controls, and a background studio (upload, crop,
  darken and palette extraction).
- Theme gallery with 21 original bundled themes and more than 90 community
  themes imported from the HACS themes directory. Variants of the same theme
  are grouped into a single gallery entry.
- One-click install to `/config/themes` with an automatic theme reload,
  uninstall, batch install, and an importer for themes hosted on GitHub.
- Pull request submission to the official themes repository using an optional
  GitHub token.
- Environment doctor that detects card-mod, Bubble Card and HACS and can fix
  `configuration.yaml` for you.
- Dashboard previews: a Lovelace dashboard simulation, a preview built from
  your own Home Assistant entities, and a live-render preview that runs the
  real Home Assistant frontend against a built-in mock backend.
- Theme requirement detection and a Custom Components tab.
- Alpine Storm Lake theme with a built-in photo artwork preset.
- Keyboard focus rings and reduced-motion support.
- PNG add-on icon and logo.
- GitHub Actions workflow that typechecks, tests, builds, lints the add-on
  configuration and builds the Docker image.

### Changed

- The add-on is reachable through Ingress only.
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
