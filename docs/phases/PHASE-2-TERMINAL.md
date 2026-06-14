# Phase 2 — SSH Connection Manager + Interactive Terminal

**Status:** complete. Delivers a working web terminal against the unraid
host over SSH, with a mobile-friendly accessory key bar.

## What this phase delivers

**Backend**
- `ssh` module: `createShellSession()` opens an `ssh2` connection + an
  interactive shell channel (PTY); `getSshStatus()` exposes a non-secret
  summary. Prefers a private key over a password. SSH config comes from env.
- `terminal` module: a `ws` gateway attached to the HTTP server's `upgrade`
  event at `/ws/terminal`. Authenticates the JWT from the query string,
  then bridges the WebSocket to the SSH shell (input, output, resize, exit).
- `GET /api/ssh/status` (auth) → `{ configured, target }`.
- `app.ts` now boots an `http.Server` so WebSocket upgrades can be handled.

**Frontend**
- `terminalSocket.ts`: opens the WS and bridges it to xterm via callbacks.
- `TerminalPage.tsx`: mounts xterm.js (fit + web-links addons), wires
  input/output/resize, shows a connection-status badge, and renders a
  friendly panel when SSH isn't configured yet.
- `AccessoryBar.tsx`: tappable Esc / Tab / ^C / ^D / ^L / arrows / `| ~ / -`
  for keys phone keyboards lack. Uses `pointerdown` + `preventDefault` so
  taps never steal focus from the terminal.
- App now uses react-router with an `AppLayout` (header + bottom nav:
  Terminal active, Files disabled until Phase 4).

## Protocol

`/ws/terminal?token=<jwt>&cols=<n>&rows=<n>`, JSON both ways:
- client → server: `{type:'input',data}` · `{type:'resize',cols,rows}`
- server → client: `{type:'output',data}` · `{type:'status',status}` ·
  `{type:'error',message}` · `{type:'exit',code}`

## Configure & run

Add to `.env`:

```
SSH_HOST=192.168.1.10
SSH_PORT=22
SSH_USER=root
SSH_PASS=your-password        # or instead:
# SSH_KEY=/path/to/private_key
```

```bash
pnpm install      # picks up ssh2, ws, @xterm/* added this phase
pnpm dev
```

Sign in → the Terminal tab connects to the host. Resize the window and
the PTY follows; tap the accessory keys on mobile.

## Lifecycle & security notes

- One SSH connection + shell channel per terminal WebSocket; both are torn
  down when the socket closes (and vice versa). Simple, isolated, no pool.
- JWT is validated on the WS upgrade before any SSH connection is attempted.
- Host-key verification is left at ssh2's default (accept) for trusted-LAN
  use; host-key pinning is a noted future hardening step.

## Next: Phase 3 — command shortcuts (defaults + editable, JSON-backed).
