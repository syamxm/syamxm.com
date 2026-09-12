# syamxm.com

Personal portfolio site — a Linux desktop in the browser. Waybar-style status bar, terminal prompts, live server metrics.

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

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
  metrics.js      live btop panel — polls metrics.syamxm.com/api/metrics
  status.js       per-project availability from status.syamxm.com/api/status
  visitors.js     "n here now" pill, fed by the metrics poll
  gallery.js      project screenshot lightbox
  ascii3d.js      ASCII 3D renderer
  hero-logo.js    spins the hero wordmark using ascii3d
  ticker.js       hero dot-matrix ticker — edit the updates array at the top
assets/           fonts, screenshots, og image
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

The metrics and status APIs use their home-server hostnames, including from localhost.
Nginx allows credential-free cross-origin reads of these public endpoints.
If they cannot be reached, the metrics panel clears old readings, the visitor pill
hides, and project cards show `offline · unverified`. Links and screenshots remain usable.

Checks to run locally:

```bash
node --test tests/*.cjs
for file in js/*.js; do node --check "$file" || break; done
git diff --check
```

To simulate an outage without shutting down the server, open browser developer
tools, enable Network request blocking, and block `*://metrics.syamxm.com/*`
and `*://status.syamxm.com/*`. Reload the page. Do not use the browser's global
Offline setting: that would also block the static site. Unblock the requests and
reload to check recovery, or wait for the automatic retries.

With the server reachable, expect current metrics and `online` on projects whose
root URL returns exactly HTTP 200. Other responses (including redirects), failed
connections, DNS failures, and timeouts mean `offline`. Missing status entries
mean `offline · unverified`. GitHub repository cards have no service marker.

Switchboard caches checks for 30 seconds; the page polls it every 30 seconds with
an 8-second request timeout. Changes can take roughly a minute to appear. Metrics
retry up to every 60 seconds after repeated failures. Hidden tabs pause polling.
The home-hosted status checker cannot verify even independently hosted projects
while it is unreachable; their markers explicitly say `unverified`.

## Deployment

Every change goes through a PR — no direct pushes to `main`.

CI (`.github/workflows/ci.yml`) runs HTML validation, `node --check`, offline-state
regression checks, a local asset reference check and a gitleaks secret scan.
After CI succeeds for a push to `main`, `deploy.yml` packages static files from
that exact revision and publishes them to GitHub Pages. PR and scheduled CI runs
do not deploy. There is no build step, SSH, or home-server connection.

### One-time setup

1. In this repository's **Settings → Pages**, select **GitHub Actions** as the source.
   Set the custom domain to `syamxm.com`. The `CNAME` file documents the domain;
   Actions-based deployment still needs this setting.
2. In Cloudflare's tunnel settings, add a published hostname:
   `metrics.syamxm.com` → `http://nginx:80`, using the same nginx service as the
   existing site routes. Keep `status.syamxm.com` on its existing tunnel route.
3. In Switchboard's local environment configuration, ensure `SITES` includes all
   nine project hosts below. Preserve any other monitored hosts:

   ```text
   beanthere.syamxm.com,taskflow.syamxm.com,debian-watch.syamxm.com,mustxrdjar.syamxm.com,cipher-agent.syamxm.com,cipher-forge.syamxm.com,cv-spring.syamxm.com,cv.syamxm.com,c-aegis.syamxm.com
   ```

4. Apply the companion Switchboard and nginx changes. From `~/switchboard`:

   ```bash
   .venv/bin/pytest -q
   docker compose up -d --build switchboard
   ```

   From `~/nginx`:

   ```bash
   docker compose exec nginx nginx -t
   docker compose exec nginx nginx -s reload
   ```

5. Check the public APIs before switching the portfolio DNS:

   ```bash
   curl -i --max-time 10 -H 'Origin: https://syamxm.com' https://metrics.syamxm.com/api/metrics
   curl -i --max-time 10 -H 'Origin: https://syamxm.com' https://status.syamxm.com/api/status
   ```

   Expect HTTP 200, JSON, `Access-Control-Allow-Origin: *`, and `Cache-Control: no-store`.
   The status JSON should contain every project host above.
   In Cloudflare, bypass any custom cache rules for these two API paths and purge
   previously cached responses once. Do not put these public read-only APIs behind
   a Cloudflare Access login.
6. Commit and push the changes yourself. After the first successful Pages deploy,
   replace only the apex and `www` tunnel routes/DNS records. Remove conflicting
   apex/`www` A, AAAA, or CNAME records and use these **DNS-only** records:

   | Type | Name | Target |
   |------|------|--------|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `syamxm.github.io` |

   Cloudflare remains the DNS provider. Other subdomains keep their existing routes.
   Once GitHub issues the certificate, enable **Enforce HTTPS** in Pages settings.
   GitHub redirects `www.syamxm.com` to the apex custom domain.
7. Visit both domains, then turn off the home server and reload from a device
   with internet access. The portfolio, fonts, screenshots, and navigation should
   still load. API readings should settle into the offline states described above.

The old portfolio nginx block can remain during migration, but the public
portfolio no longer uses it after the DNS switch. Its previous `/api/metrics`
route has moved to the dedicated metrics hostname. The site's CSP is now in
`index.html`, because GitHub Pages does not serve the old nginx response headers.

## License

Code is free to learn from. Content, copy and images are mine.
