# Security Policy

HATS is a Home Assistant app. It runs with access to your `/config` directory and, depending on
configuration, the Home Assistant Supervisor and Core APIs. A vulnerability here can affect your
Home Assistant instance directly, not just the web UI — please report issues privately rather than
as a public GitHub issue.

## Supported Versions

HATS ships as a single rolling release, not parallel maintained branches. Only the **latest
published version** receives security fixes.

| Version         | Supported          |
| --------------- | ------------------ |
| Latest release  | :white_check_mark: |
| Anything older  | :x: — please update |

If you're running an older version and can't reproduce an issue on the latest release, update
first before reporting.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for a security vulnerability.**

Use GitHub's private vulnerability reporting instead:

1. Go to the [Security tab](https://github.com/HomeRiz/hats/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue: what it is, how to reproduce it, and the impact you'd expect (e.g. "reads
   arbitrary files under `/config`", "runs code in the browser", "exposes the Supervisor token").

If private reporting isn't available to you for some reason, open a regular issue asking for a
private contact channel — without vulnerability details in the issue itself — and we'll follow up.

### What to expect

This is a small, community-maintained app, maintained on a best-effort basis rather than under a
formal SLA:

- **Acknowledgement**: within a few days of the report.
- **Triage**: we'll confirm whether it's reproducible and roughly how severe it is.
- **Fix**: critical issues (anything letting an attacker reach your Home Assistant instance or its
  data without authentication) are prioritized for a patch release as soon as practical. Lower
  severity issues are scheduled into a normal release.
- **Disclosure**: once a fix is released, we credit the reporter (unless you'd rather stay
  anonymous) and publish a summary in the [changelog](CHANGELOG.md) and, for anything significant,
  a GitHub Security Advisory. We ask reporters to hold off on public disclosure until a fix has
  shipped.
- **Declined reports**: if something is reported that turns out not to be a vulnerability (e.g.
  expected app behavior, or something only exploitable with prior admin access to Home
  Assistant), we'll explain why and close it — you're welcome to push back if you disagree.

## Scope

In scope: the HATS app itself - its server (`server/`), frontend (`src/`), Docker image, and
its interaction with the Home Assistant Supervisor and Core APIs.

Out of scope: Home Assistant Core, Home Assistant Supervisor, HACS, or other third-party
integrations and apps - please report those to their own maintainers. Issues that require an
attacker to already have admin access to your Home Assistant instance are generally lower priority,
since that level of access already grants broad control over the system.
