# unraidpwa — Design (Approved)

**Status:** Approved 2026-06-13. No implementation started yet.
This document is the single source of truth for the build.

A PWA to control an unraid box: interactive terminal with tappable
command shortcuts, plus a file/folder explorer. PWA quality bar
(installable, auto-updating, push-capable) mirrors `tjbookrequests-v3`.

---

## 1. Locked decisions

| Area          | Decision                                          |
|---------------|---------------------------------------------------|
| Architecture  | **SSH-to-host** via `ssh2` (Model A)              |
| Auth          | **Single user**, JWT session                      |
| Local state   | **Plain JSON file** (no SQLite, no MongoDB)       |
| Push          | **Infrastructure only** — no triggers wired in v1 |
| Repo layout   | pnpm monorepo with `shared` package (kept)        |
| Deployment    | Single multi-stage Docker container on unraid     |

Principles: KISS, YAGNI, SOLID. Deliberately **not** copying v3's
multi-user accounts, roles, registration, email, reader, or database.

## 2. Security model (read first)

This app is, functionally, **remote shell + filesystem access to the
NAS as root**. That dominates every decision below.

- **Single-user auth.** One admin login (username + password from env /
  first-run), JWT session. No registration, no roles.
- **Not for raw internet exposure.** Intended for LAN, or behind
  Tailscale / Wireguard / an authenticated reverse proxy. Documented,
  not enforced by the app.
- **Path sandboxing.** Every file path is resolved and validated against
  an allowlist of roots (`ALLOWED_ROOTS`, e.g. `/mnt/user`, `/boot`).
  Blocks `../` traversal and symlink escape.
- **Secrets never in git.** SSH credentials + JWT secret come from env /
  the unraid container template only.
- **Audit log.** Executed shortcut-commands and file mutations are
  appended to a local log file.
- **Rate limiting** on auth and file-mutation endpoints.

## 3. Architecture — SSH to the host

The backend connects to the unraid host over SSH using `ssh2`.

```
PWA (xterm.js + file UI)
   |  HTTPS (REST) + WebSocket (terminal stream)
   v
Backend container (Express + ssh2)
   |  SSH shell channel  -> interactive terminal
   |  SFTP channel       -> file explorer ops
   v
unraid host (real root control)
```

Rationale: controls the **actual host** (not just the container), needs
**no privileged container**, unifies terminal + files behind one
credential/transport, and `ssh2` avoids `node-pty`'s native-build pain
in Docker. One authenticated SSH client per app session; it exposes
shell channels (terminal) and an SFTP channel (files).

## 4. Tech stack

**Frontend** (same as v3): React 18 + TypeScript + Vite + Tailwind +
`vite-plugin-pwa` (injectManifest) + Workbox + Zustand + TanStack Query
+ react-router + axios + lucide-react. Plus **xterm.js** (fit +
web-links addons) for the terminal.

**Backend:** Express + TypeScript + zod + JWT, same module pattern as v3
(`*.controller.ts` / `*.routes.ts` / `*.service.ts` / `index.ts`).
Key libraries: **`ssh2`** (terminal + SFTP), **`ws`** (terminal socket),
**`web-push`** (push infra). State persisted to a **plain JSON file**
via a tiny store module (atomic write; `lowdb` optional).

No database. No SQLite. No Mongo.

## 5. Repo structure

```
unraidpwa/
  packages/
    shared/     # shared TS types: paths, shortcuts, WS message protocol
    backend/    # express + ssh2 + json store
    frontend/   # react PWA
  Dockerfile        # multi-stage; single container serves both
  docker-compose.yml
  docs/
    DESIGN.md       # this file
    phases/         # per-phase build docs (created when we start)
```

## 6. Backend modules

- `auth` — single-user login, JWT issue/refresh.
- `ssh` — connection manager (one ssh2 client per session; provides
  shell channels + SFTP).
- `terminal` — WebSocket bridge xterm.js <-> SSH shell PTY
  (input, output, resize).
- `files` — REST over SFTP: list, stat, read/preview, download, upload,
  mkdir, rename, move, delete — all path-sandboxed.
- `shortcuts` — CRUD for command shortcuts (defaults + user edits),
  persisted to JSON.
- `notifications` — VAPID key + subscribe/unsubscribe + web-push send
  helper (infra only; no triggers wired in v1).
- `system` *(optional, later)* — quick status via canned SSH commands.

## 7. Frontend screens

- **Terminal** — full-screen xterm.js; a **mobile accessory key bar**
  (Esc, Tab, Ctrl, arrows, `|`, `/`, `~`) for keys phone keyboards lack;
  a **shortcuts drawer** of tappable commands that insert-or-run.
- **Files** — breadcrumb + list; tap to navigate; long-press / swipe for
  actions; text preview; upload / download; optional "open terminal here".
- **Settings** — connection status, shortcut editor, push toggle, app
  version + update prompt (v3-style auto-version).

## 8. Terminal shortcuts

Tappable, categorized, editable command buttons. Defaults seeded on
first run (e.g. *Docker* `docker ps`; *Array* `mdcmd status`; *Logs*
`tail -f /var/log/syslog`; *Mover* `mover status`). User can add / edit /
delete; persisted to JSON. Each shortcut is either "insert into prompt"
or "run immediately".

## 9. PWA / push / update

Reuse v3's proven pieces: `injectManifest` service worker,
`registerType: 'prompt'`, the `PWAUpdatePrompt` that checks every 5 min
+ on focus/visibility, install prompt, offline indicator (app shell only
— terminal/files are inherently online; the SW must NOT cache the
terminal WebSocket or file endpoints). Push **infrastructure** is wired
(VAPID, subscribe, SW push/notificationclick handlers) but **no triggers
are sent in v1**.

## 10. Deployment on unraid

Single multi-stage Docker container (frontend static + backend), non-root
user, healthcheck — same shape as v3's Dockerfile. An unraid
Community-Apps-style template will be provided.

**Env vars:**
`APP_USER`, `APP_PASS`, `JWT_SECRET`, `SSH_HOST`, `SSH_PORT`, `SSH_USER`,
`SSH_KEY` or `SSH_PASS`, `ALLOWED_ROOTS`, `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_EMAIL`.

**Volumes:** JSON state file + audit log on a mounted path.

## 11. Phased build plan

1. **Scaffold** — monorepo, `shared`/`backend`/`frontend`, Vite + PWA
   shell, Tailwind, Docker skeleton, single-user auth.
2. **SSH + terminal** — connection manager, WebSocket bridge, xterm.js
   UI, resize, mobile accessory key bar.
3. **Shortcuts** — defaults seed, CRUD, JSON store, drawer UI.
4. **File explorer** — SFTP CRUD, path sandboxing, list/preview/upload/
   download UI.
5. **PWA polish** — install prompt, update prompt, offline indicator,
   push infra (VAPID + subscribe + SW handlers).
6. **Deploy** — Dockerfile finalize, unraid template, docs.

Each phase gets its own `docs/phases/PHASE-N-*.md` when we begin it.

## 12. Open / future (YAGNI for now)

- Push *triggers* (e.g. notify when a long-running command finishes).
- `system` status dashboard (array/disk/docker) — possibly via the
  unraid GraphQL API later instead of canned SSH commands.
- Multi-user — explicitly not planned.

---

*End of approved design. Awaiting go-ahead to start Phase 1.*
