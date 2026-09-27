# Home Assistant Add-on: HATS (Home Assistant Theme Store)

## How to Install

1. In Home Assistant, navigate to **Settings** → **Add-ons** → **Add-on Store**.
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

HATS can open a pull request with your theme. It needs a GitHub token:

1. GitHub, Settings, Developer settings, Personal access tokens, **Tokens (classic)**, Generate new token.
2. Tick **only `public_repo`**. Leave every other box unticked (no `repo`, `workflow`, `admin:*`, `delete_repo`, `user`, ...). Set a short expiry (30 to 90 days).
3. Paste it into **Settings, Add-ons, HATS, Configuration, GitHub token** and save. The token stays on the server, is never sent to your browser and is only sent to `api.github.com`.

If you skip step 3 you can paste the token in the submission dialog instead; it is used once and discarded.

If the HATS repository is private, a `public_repo` token cannot see it. Use a fine-grained token limited to that single repository with **Contents: Read and write** and **Pull requests: Read and write**.
