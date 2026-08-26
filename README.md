# syamxm.com

Personal portfolio site — a Linux desktop in the browser. Waybar-style status bar, terminal prompts, live server metrics.

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

Live: [syamxm.com](https://syamxm.com) — open to freelance work. More features on the way.

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
  perf.js         disables heavy effects on weak devices and hidden tabs
  boot.js         BIOS/kernel boot sequence (once per session)
  main.js         interactive shell, scrollspy, stack filter, typed output
  metrics.js      live btop panel — polls /api/metrics
  visitors.js     "n here now" pill, fed by the metrics poll
  gallery.js      project screenshot lightbox
  ascii3d.js      ASCII 3D renderer
  hero-logo.js    spins the hero wordmark using ascii3d
  ticker.js       hero dot-matrix ticker — updates array lives at the top
scripts/
  generate-motd   asks local Ollama for the message of the day
assets/           fonts, screenshots, og image
motd.json         generated, gitignored — absent means the ticker shows updates only
```

CSS and JS are loaded with `?v=` cache-busting params. Bump them in `index.html` when you change a file, or the server keeps serving the old one.

## Sections

| # | Nav label | Anchor | What it shows |
|---|-----------|--------|---------------|
| I | about | `#about` | hero, typed `whoami` output |
| II | projects | `#projects` | project cards with screenshot galleries |
| III | stack | `#stack` | filterable tooling list, styled as `ps` output |
| IV | uses | `#uses` | daily-driver hardware and software |
| V | live | `#btop` | real-time CPU, temperature and uptime from the home server |
| VI | timeline | `#timeline` | commit-graph career history |
| VII | security | `#posture` | pipeline gates and server hardening |
| VIII | contact | `#contact` | email, WhatsApp, GitHub, LinkedIn |

Type `help` in the prompt to list shell commands.

## Running locally

Any static server works:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

To refresh the ticker's message of the day, schedule `OLLAMA_URL=http://localhost:11434 OLLAMA_MODEL=llama3.2 /path/to/syamxm.com/scripts/generate-motd` on the server twice a day.

The live metrics panel needs `/api/metrics` on the same origin. Without it the panel shows an offline state and the visitor pill stays hidden — everything else works.

## Deployment

Every change goes through a PR — no direct pushes to `main`.

CI (`.github/workflows/ci.yml`) runs HTML validation, `node --check` on every JS file, a local asset reference check and a gitleaks secret scan. On green, `deploy.yml` connects over Tailscale and pulls `main` on the server.

## License

Code is free to learn from. Content, copy and images are mine.
