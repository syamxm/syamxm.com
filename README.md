# syamxm.com
# Internship Update

Personal portfolio site — a Linux desktop in the browser. Waybar-style status bar, terminal prompts, live server metrics.

Built with plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

Live: [syamxm.com](https://syamxm.com)

## Structure

```
index.html        all markup — one page, eight sections
404.html          not-found page
css/
  base.css        tokens, resets, typography
  layout.css      status bar, burger menu, hero, section shells
  components.css  cards, terminal windows, pills, gallery
  fonts.css       self-hosted JetBrains Mono
js/
  boot.js         BIOS/kernel boot sequence (once per session)
  main.js         interactive shell, scrollspy, stack filter, typed output
  metrics.js      live btop panel — polls /api/metrics
  gallery.js      project screenshot lightbox
  perf.js         disables heavy effects on weak devices and hidden tabs
assets/           fonts, screenshots, og image
```

## Sections

| # | Section | What it shows |
|---|---------|---------------|
| I | about | hero, typed `whoami` output |
| II | projects | project cards with screenshot galleries |
| III | stack | filterable tooling list, styled as `ps` output |
| IV | uses | daily-driver hardware and software |
| V | live | real-time CPU, temperature and uptime from the home server |
| VI | timeline | commit-graph career history |
| VII | security | pipeline gates and server hardening |
| VIII | contact | email, GitHub, internship availability |

## Features

- Interactive prompt — type `help` to list commands
- Live metrics polled from a self-hosted endpoint, with backoff on failure
- Scrollspy that keeps the status bar workspace pills in sync
- Burger menu navigation on mobile
- Respects `prefers-reduced-motion` and throttles animation on low-core devices

## Running locally

Any static server works:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

The live metrics panel needs `/api/metrics` behind the same origin. Without it the panel degrades to an offline state — everything else works.

## Deployment

Push to `main` triggers CI (`.github/workflows/ci.yml`):

- HTML validation
- `node --check` on every JS file
- local asset references resolve
- gitleaks secret scan

On green, `deploy.yml` connects over Tailscale and pulls `main` on the server. No direct pushes to `main` — every change goes through a PR.

## License

Code is free to learn from. Content, copy and images are mine.
