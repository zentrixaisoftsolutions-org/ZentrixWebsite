# CI/CD — GitHub Actions → Hetzner

Pipeline defined in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

Mirrors the SchoolErp pipeline (same server, same secrets, same gating), minus the
build and test stages — this is a static site with no build step and no test suite.

## What it does

| Trigger | Validate | Deploy |
|---|---|---|
| PR to `main` | ✅ | — |
| Push to `main` | ✅ | ✅ (only if validation passes) |
| Manual "Run workflow" | ✅ | — (dispatch validates only) |

**Validate steps** — the static-site equivalent of SchoolErp's pytest/vitest jobs:
1. HTML parsed with `tidy` (fails only on exit ≥ 2 — real parse errors, not HTML5 warnings).
2. CSS parsed with `postcss`. Not `csslint`: it is unmaintained and rejects valid
   CSS Grid as a syntax error, which would fail every build.
3. JS syntax-checked with `node --check`.
4. Every relative `href`/`src` in the HTML must resolve on disk — a broken
   `css/style.css` path is the most likely way this site ships visibly broken.

**Deploy steps** (push to `main`, validation green):
1. `rsync` the repo root → `/var/www/html/zentrix/` with `--delete`, excluding
   `.git`, `.github`, `.claude`, `node_modules`, `*.md`.
2. On the server: `chown www-data`, `nginx -t`, `systemctl reload nginx`.
3. Health-check: curl the site over **https on 443** and require HTTP 200, then
   grep the body for `zentrix` to confirm it is this vhost and not another.

   Port matters here. The `zentrixaisoftsolutions.com` server block listens on
   443 only; port 80 is a `default_server` catch-all that `return 301`s to https.
   A plain http check therefore returns 301 and fails even on a good deploy --
   which is exactly how the first pipeline run failed. The check uses
   `curl --resolve zentrixaisoftsolutions.com:443:127.0.0.1` so it gets correct
   SNI and a real certificate check without depending on external DNS.

The deploy job fails (visible red in Actions) if nginx does not return 200.

`--delete` is safe here because the site owns `/var/www/html/zentrix` outright;
nothing server-only lives in that directory. (SchoolErp's backend rsync omits
`--delete` because `.env` and `uploads/` live inside its tree.)

## One-time setup (in GitHub)

### 1. Repository secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `SSH_HOST` | `46.225.100.9` |
| `SSH_USER` | `root` |
| `SSH_PRIVATE_KEY` | full contents of `~/.ssh/schoolerp_ci` (incl. BEGIN/END lines) |

This reuses SchoolErp's deploy key — already authorised on the server, so no
`ssh-copy-id` step is needed. **Note:** this repo is public while SchoolErp is
private, so anyone with write access here can read that secret via a pushed
workflow, and it is the same key that deploys the ERP. To isolate them, generate a
dedicated key and swap `SSH_PRIVATE_KEY`:

```bash
ssh-keygen -t ed25519 -C "zentrix-website-deploy" -f ~/.ssh/zentrix_website_ci -N ""
ssh-copy-id -i ~/.ssh/zentrix_website_ci.pub root@46.225.100.9
```

### 2. Create the `production` environment
Repo → **Settings → Environments → New environment** → name it exactly
`production`. The deploy job targets `environment: production` and will not run
without it. Optionally add **required reviewers** so a human approves each deploy.

### 3. Server prerequisite (not handled by the pipeline)
The workflow rsyncs to `/var/www/html/zentrix` but does **not** configure nginx.
A server block must already serve that directory for `zentrixaisoftsolutions.com`,
or rsync will succeed and the health check will fail. Verify with:

```bash
ssh root@46.225.100.9 "grep -rE 'server_name|root ' /etc/nginx/sites-enabled/"
```

## Rollback
Revert the commit on `main` and let the pipeline redeploy. Because the deploy is a
plain `rsync` of tracked files with no build artefacts, the deployed state always
matches a commit exactly.

## Notes
- No build step: `index.html`, `css/`, and `js/` ship as-is. Adding a bundler later
  means adding a build step before the rsync and pointing it at the output dir.
- `root` is used for deploy because that is the current server setup, matching
  SchoolErp. A limited `deploy` user with sudo rights to `systemctl reload nginx`
  and `/var/www/html/zentrix` would be tighter; update `SSH_USER` if you create one.
- The health check's `Host:` header must match the nginx `server_name`. If the
  domain changes, update it in `deploy.yml`.
