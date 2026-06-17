# Deployment Channels

This project publishes through three separate channels. Keep this file aligned with `package.json`, `.github/workflows/pages.yml`, `next.config.ts`, and the deployment scripts under `scripts/`.

## Language Strategy

- Build-time default locale is controlled by `NEXT_PUBLIC_DEFAULT_LOCALE`.
- `Self-hosted` uses `zh`.
- `GitHub Pages` uses `zh`.
- `Vercel` uses `en`; when `NEXT_PUBLIC_DEFAULT_LOCALE` is not set, `src/lib/deployment-locale.ts` infers `en` from the Vercel runtime flag.
- Shareable locale paths are always available:
  - `/zh`
  - `/en`
  - `/zh/experiences/[slug]`
  - `/en/experiences/[slug]`
- Root path `/` renders the deployment default locale directly.
- Static export does not depend on middleware, cookies, or runtime redirects.

## Public URLs

- `International site (Vercel)`: `https://my-resume-gray-five.vercel.app`
- `GitHub site (Pages)`: `https://byted-x.github.io/My-Resume/`
- `China mainland site (Self-hosted)`: `https://www.byted.online`
- `China mainland site fallback (Self-hosted IP)`: `http://106.12.154.163`

1. `Vercel`
   - Trigger: Vercel Git integration on `main`
   - Purpose: international site
   - URL: `https://my-resume-gray-five.vercel.app`
   - Default locale: `en`
   - Verify: `curl -I https://my-resume-gray-five.vercel.app`

2. `GitHub Pages`
   - Trigger: `.github/workflows/pages.yml`
   - Purpose: GitHub-hosted static site
   - URL: `https://byted-x.github.io/My-Resume/`
   - Default locale: `zh`
   - Verify: `curl -I https://byted-x.github.io/My-Resume/`

3. `Self-hosted server`
   - Trigger: `git push` to the SSH bare repo on `106.12.154.163`
   - Purpose: China mainland site via standalone Next.js behind Nginx with a canonical domain
   - Default locale: `zh`
   - Public URLs:
     - canonical domain: `https://www.byted.online`
     - fallback IP: `http://106.12.154.163`
   - Pipeline:
     - local git push writes to both GitHub and the server bare repo
     - server `post-receive` hook records the target SHA
     - `systemd-run` starts an asynchronous deployment job
     - the server builds `next build` locally with Node 22, rotates the release symlink, restarts `portfolio.service`, and health-checks `127.0.0.1:3000`
   - Verify:
     - `npm run deploy:server:status`
     - `ssh root@106.12.154.163 "systemctl status portfolio.service --no-pager"`
     - `curl -I http://106.12.154.163`
     - `curl -I https://www.byted.online`

## Server Setup

Install or refresh the self-hosted CI channel:

```bash
npm run setup:server:ci
```

Enable or refresh domain HTTPS:

```bash
npm run setup:server:https
```

The HTTPS bootstrap installs an isolated `certbot` runtime on the server, writes a temporary HTTP ACME config, issues a certificate for `www.byted.online`, and then switches Nginx to the final HTTPS proxy config. If the domain is still blocked by ICP/备案 or upstream ingress policy, certificate issuance will fail until that network prerequisite is cleared.

## Current domain checklist

The ICP filing for `www.byted.online` is complete. Treat the canonical domain as the primary public entry and keep the fallback IP only for troubleshooting.

Recommended configuration after filing approval:

```bash
NEXT_PUBLIC_SITE_URL=https://www.byted.online
SERVER_PUBLIC_URL=https://www.byted.online
VERIFY_SERVER_PUBLIC_URL=true
```

Recommended rollout order:

1. Refresh the server environment so `NEXT_PUBLIC_SITE_URL` points to `https://www.byted.online`.
2. Rebuild and redeploy the self-hosted release.
3. Run `npm run setup:server:https` if the TLS certificate still does not match `www.byted.online`.
4. Confirm `curl -I https://www.byted.online` succeeds without `-k`.
5. Keep `VERIFY_SERVER_PUBLIC_URL=true` in CI so the public domain remains a required gate.

After setup, plain `git push` to `origin` will push to both GitHub and the server because `origin` gets a second `pushurl`. The repository also keeps a dedicated `server` remote for direct troubleshooting.

Optional environment overrides for setup/status/deploy scripts:

- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_PORT`
- `SERVER_GIT_DIR`
- `SERVER_APP_DIR`
- `SERVER_SERVICE_NAME`
- `SERVER_NODE_BIN`
- `SERVER_NPM_CLI`
- `SERVER_BIND_HOST`
- `SERVER_APP_PORT`
- `NEXT_PUBLIC_SITE_URL`
- `SERVER_CANONICAL_HOST`
- `SERVER_ADDITIONAL_DOMAINS`
- `SERVER_REDIRECT_HOSTS`
- `SERVER_IP_PUBLIC_URL`
- `KEEP_RELEASES`
- `LOCAL_ORIGIN_REMOTE`
- `LOCAL_SERVER_REMOTE`
- `SKIP_BUILD=1` to reuse an existing local build artifact

## Common Commands

Push all release channels:

```bash
git push
```

Explicit push helper:

```bash
npm run push:all
```

Check self-hosted deployment status:

```bash
npm run deploy:server:status
```

## Locale Verification

Verify deployed roots and explicit locale paths:

```bash
curl -I https://my-resume-gray-five.vercel.app/
curl -I https://my-resume-gray-five.vercel.app/en
curl -I https://my-resume-gray-five.vercel.app/zh
curl -I https://byted-x.github.io/My-Resume/
curl -I https://byted-x.github.io/My-Resume/en
curl -I https://byted-x.github.io/My-Resume/zh
curl -I https://www.byted.online/
curl -I https://www.byted.online/en
curl -I https://www.byted.online/zh
```

Static export verification:

```bash
npm run build:pages
test -f out/index.html
test -f out/zh/index.html
test -f out/en/index.html
```

`npm run build:pages` sets `NEXT_PUBLIC_STATIC_EXPORT=true`, defaults the static locale to `zh`, accepts an optional GitHub Pages base path argument, temporarily disables the intercepting experience route, clears `.next` and `out`, runs `npm run build`, and then runs `npm run optimize:images`.

## Rollback

The active release is always the `/var/www/portfolio/current` symlink.
To roll back, repoint it to an older release under `/var/www/portfolio/releases/` and restart `portfolio.service`.

## Notes

- The self-hosted channel is intentionally independent of GitHub Actions. GitHub only receives the same git push and continues triggering `Vercel` plus `Pages`.
- The server build runs with `/root/.local/share/mise/installs/node/22.22.1/bin/node`, not the system default `node`.
- Public endpoint verification in `.github/workflows/pages.yml` always checks `Vercel`, `GitHub Pages`, and the self-hosted IP endpoint. The self-hosted domain is checked as optional by default; set `VERIFY_SERVER_PUBLIC_URL=true`, `1`, `required`, or `strict` when `https://www.byted.online` should become a required gate.
- `git push` across GitHub and the server is not atomic. If one remote succeeds and the other fails, resolve the failed side explicitly and push again.
