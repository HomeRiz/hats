# Home Assistant App: HATS (Home Assistant Theme Store)

## How to Install

1. In Home Assistant, go to **Settings** → **Apps** and click **Install app** to open the **App store**.
2. Click the three dots (**⋮**) in the top right corner and select **Repositories**.
3. Add the repository URL: `https://github.com/HomeRiz/hats`
4. Find **HATS - Home Assistant Theme Store** in the store list and click **Install**.
5. Enable **Show in sidebar** and click **Start**.
6. Open **HATS** from your Home Assistant sidebar! 🎩

---

## What HATS Does Inside Home Assistant

- **1-Click Theme Installation**: Saves your custom themes directly to `/config/themes/<theme_id>.yaml` and automatically reloads Home Assistant themes in real-time.
- **Background Asset Syncing**: Automatically places uploaded wallpapers and artwork in `/config/www/hats/backgrounds/<theme_id>/default.webp`.
- **Live Lovelace Sandbox**: Test Mushroom cards, Tile cards, weather cards, climate sliders, and media players with real `backdrop-filter` and glassmorphism.
- **Theme Submission Assistant**: Validates and packages your custom themes with automated YAML generation, ready to submit to the official repository.

---

## Submitting themes to GitHub

HATS can open a pull request with your theme. It needs a GitHub token. The token always stays on
the HATS server: it is only ever sent to `api.github.com`, never to your browser.

### 1. Create the token

Go to GitHub, **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate
new token**.

- **Which scope to tick** matters, because it decides what that token can do if it ever leaks:
  - **HATS repository is public:** tick **only `public_repo`**. Leave everything else unticked
    (`repo`, `workflow`, `admin:*`, `delete_repo`, `user`, ...).
  - **HATS repository is private, or you're testing before it's public:** `public_repo` cannot see
    a private repository. Instead create a **fine-grained token**, limit it to that one repository,
    and grant only **Contents: Read and write** and **Pull requests: Read and write**.
- Set a short expiry (30–90 days) and re-create it when it lapses.

### 2. Save it, so you don't paste it every time

Two ways to save it; either is fine, and both stay on the server:

- **In HATS (recommended):** open **HATS Setup** in HATS, scroll to **GitHub Token for Theme
  Submissions**, paste the token, and click **Save**. This writes it into the app's own
  Configuration and restarts HATS to apply it (a few seconds of downtime while it does).
- **Settings → Apps → HATS → Configuration:** paste it into the **GitHub token** field there
  instead and click **Save**, then restart the app yourself for it to take effect.
- **Via `secrets.yaml`:** put the real token in `/config/secrets.yaml`, e.g.
  `hats_github_token: ghp_xxxxxxxxxxxx`, then in that same Configuration page switch to YAML mode
  and set `github_token: !secret hats_github_token`. Home Assistant has a known bug where re-saving
  that Configuration page from the UI afterwards can expand the `!secret` reference back into the
  plain token on screen — the in-app Save button above avoids that entirely, since it never displays
  the token back to you.

Either way, a token you type directly into the **Submit PR** dialog without saving it anywhere is
used once for that submission and then discarded; you'll need to paste it again next time.
