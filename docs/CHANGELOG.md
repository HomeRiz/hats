# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-10-08

### Added

- A GitHub button in the top bar. Paste a repository link or `owner/name` and
  HATS opens that repository's themes in the preview, so nobody has to edit the
  address by hand.
- Browse HACS themes in the Community tab. Search, sort and filter every theme
  repository in the HACS catalog, see its license and stars, and preview it.
  A daily workflow builds the index the list reads.
- The desktop installers for macOS, Windows and Linux are attached to the
  GitHub release when a version tag is pushed.
- The desktop app now has a default HATS folder in Documents. The save dialog
  for an exported zip opens in its Exports folder, and every theme you import
  is also saved there, with its background image, in the Imported folder. The
  File menu opens each folder.

### Changed

- The preview website is read only. It no longer offers New Theme, Import,
  Create, Duplicate, Delete or Copy, it lists only the built-in themes, and
  themes opened from a repository are never saved in the browser.
- Previewed themes that set no accent or Bubble Card color now use their active
  state color, then their primary color, then their accent color. Mushroom
  Cards and Button Card keep their own default colors.
- Copying the same repository theme twice opens the existing copy, and
  identical saved copies are merged into one when the page loads.
- The README now explains how card mods behave when a theme sets nothing for
  them, and the GitHub Pages link is at the top.

### Fixed

- Wallpapers that a theme embeds as a `data:image` URL, or sets as
  `background-image` instead of `lovelace-background`, now show in the preview.
- Themes that use their own color names, such as `primary-color` plus component
  variables, now fill the Palette tab with matching colors instead of defaults.
- The editor sections stay open for themes previewed from GitHub, with a banner
  naming the source repository.
- Light themes that set no card background no longer show dark cards with
  unreadable text.
- The GitHub popover is no longer hidden behind the live preview.

## [1.2.0] - 2026-10-05

### Added

- A standalone desktop app for macOS, Windows and Linux. It runs the designer
  and the live preview on your own computer, with no Home Assistant needed, and
  only answers to the local machine.
- A preview-only website at https://homeriz.github.io/hats/. Open it with
  `?repo=OWNER/REPO` to see any public GitHub theme repo exactly as its author
  published it, in the real Home Assistant frontend. It installs nothing.
- Download .zip in the export dialog. The zip holds the theme and its
  background image in the folders Home Assistant expects, a per-view snippet
  and a README with the install steps.
- Select several themes in the library and use Export Selected to download
  them in one zip.
- An Import dialog for a theme YAML, a background image and a per-view
  snippet, in the top bar next to Export.
- UIX as a styling engine next to card-mod, chosen with a switch in the Doctor.
- The per-view tab of the export dialog now explains what the snippet does
  and where to paste it.

### Changed

- In the theme library, a click selects a theme. A double click or the eye icon
  opens its preview. Export is shown only on the Designer tab.
- In the standalone app, the actions that only make sense inside Home
  Assistant are gone: Sync HA, the Installed filter, Install and the pop-out
  button. Download takes the place of Install.
- The live preview is a single Home page, a Layout Card grid with an example of
  every card family, so one page is enough to compare changes.
- Each card switch in the Cards tab now matches what the theme generates.
  Stack-in-Card merges the cards inside it into one glass card, and the Button
  Card ripple is stronger on hover and press.
- UIX is named before card-mod in the interface and the docs.

### Fixed

- The live preview no longer goes blank after Edit in Designer from the theme
  dialog.
- The per-view background snippet now works on themes made in HATS.
- The selected item in the sidebar stays visible when card-mod is off.
- The local server refuses requests with an unexpected Host header, and the
  desktop window only follows links that really point to the app.
- Theme files larger than 512 KB, like ones with an embedded background image,
  now import and preview. A repository without a theme file no longer
  produces a made-up theme.

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
