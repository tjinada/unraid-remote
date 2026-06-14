# Phase 1 — Scaffold + Single-User Auth

**Status:** complete. Delivers an installable PWA shell you can log into,
ready for Phase 2 (SSH + terminal).

## What this phase delivers

- pnpm monorepo: `shared`, `backend`, `frontend`.
- Backend (Express + TS, ESM): config/env, logger, response envelope,
  middleware (error, JWT auth guard, request logger), and the `auth`
  module (login / refresh / me) for a single env-configured user.
- The plain-JSON persistence primitive (`store/jsonStore.ts`) — the app's
  only state mechanism. Unused in Phase 1; features adopt it as needed.
- Frontend (React + Vite + Tailwind + vite-plugin-pwa): login screen,
  auth store with token refresh, PWA update prompt, service worker with
  precache + push **infrastructure** (no triggers), placeholder shell.
- Docker skeleton + compose, `.env.example`.

## Key decisions (recap from DESIGN.md)

- **Single-user auth** via `APP_USER` / `APP_PASS` env, JWT access +
  refresh tokens. No registration, no roles, no database.
- Credentials compared in constant time; no secrets in git.
- Service worker never caches `/api` or the future `/ws` terminal socket.

## Run it

```bash
pnpm install
cp .env.example .env     # set APP_USER, APP_PASS, JWT_SECRET
pnpm dev                 # backend :3000, frontend :5173
```

Open http://localhost:5173, sign in, and you should land on the
placeholder shell showing Terminal (Phase 2) and Files (Phase 4) tiles.

## Endpoints

- `GET  /api/health`     — liveness.
- `POST /api/auth/login` — `{ username, password }` → tokens + user.
- `POST /api/auth/refresh` — `{ refreshToken }` → new tokens.
- `GET  /api/auth/me`    — current user (requires Bearer token).

## Notes / follow-ups

- App icon is a placeholder SVG; PNG icons can be added in Phase 5 polish.
- `pnpm-lock.yaml` is generated on first `pnpm install` (needed by Docker's
  `--frozen-lockfile`).
- `ssh2`, `ws`, and `web-push` deps are added in the phases that use them,
  to keep each phase's install honest (YAGNI).

## Next: Phase 2 — SSH connection manager + interactive terminal.
