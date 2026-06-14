# Phase 5 — PWA Polish (push deferred)

**Status:** complete (polish only). Push notification *wiring* (VAPID +
subscribe UI) is intentionally **not** done yet — the dormant push handlers
in the service worker from Phase 1 remain, ready for later.

## What this phase delivers

- **InstallPrompt** — captures `beforeinstallprompt` and shows a small,
  dismissible "Install Unraid Control" card (Chrome/Edge/Android). Hidden
  once installed. iOS Safari doesn't fire the event, so nothing shows there.
- **OfflineIndicator** — a thin top banner when the browser goes offline,
  since the terminal and file explorer both need a live connection.
- **iOS standalone meta tags** in `index.html` (`apple-mobile-web-app-*`,
  `apple-touch-icon`) so an iOS home-screen launch looks app-like.
- All three PWA helpers (these two + the existing `PWAUpdatePrompt`) mount
  at the app root.

## Already in place (Phase 1)

- Installable manifest, `injectManifest` service worker with app-shell
  precache, SPA navigation fallback, and update-on-focus/interval via
  `PWAUpdatePrompt`. The SW does **not** cache `/api` or the terminal
  WebSocket (they're online-only).

## Deferred

- Push notifications: VAPID keys, subscribe/unsubscribe UI, and any
  triggers (e.g. "command finished"). The SW `push` / `notificationclick`
  handlers already exist; wiring is a later opt-in.

## Notes

- App icon is still the placeholder SVG. PNG icons (192/512 + maskable) are
  a nice future addition for crisper install icons, especially on iOS.

## Remaining: optional unraid Community-Apps template; push wiring (when wanted).
