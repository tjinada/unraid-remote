# unraidpwa

A PWA to control an unraid box: an interactive terminal with tappable
command shortcuts, and a file/folder explorer. Installable, auto-updating,
push-capable.

See [`docs/DESIGN.md`](docs/DESIGN.md) for the approved architecture and
[`docs/phases/`](docs/phases) for per-phase build notes.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind + vite-plugin-pwa + xterm.js
- **Backend:** Express + TypeScript + ssh2 (SSH/SFTP to the host) + JWT auth
- **State:** plain JSON file (no database)
- **Deploy:** single Docker container on unraid

## Development

```bash
pnpm install
cp .env.example .env        # then edit APP_USER / APP_PASS / JWT_SECRET
pnpm dev                    # backend :3000, frontend :5173 (proxies /api)
```

## Security

This app provides shell + filesystem access to your NAS. **Do not expose it
raw to the internet** — keep it on your LAN or behind Tailscale / Wireguard /
an authenticated reverse proxy. Secrets come from env only and are never
committed.

## Status

Files Workspace v2 + PWA polish complete — a single resizable workspace
(dual-pane explorer with drag-and-drop, permissions editor, docked terminal),
installable with an install prompt and offline indicator, and Dockerised for
unraid. Push notifications are scaffolded but not wired (deferred).
