# Phase 4.5 — Files Workspace v2

**Status:** complete. The Terminal and Files tabs are merged into one
resizable workspace: a dual-pane file explorer over a docked terminal,
with drag-and-drop moves, and a permissions editor.

## What changed

**Single workspace (no more tabs)**
- `WorkspacePage` replaces the router/tab layout. App root now renders
  `AppLayout > WorkspacePage` directly (react-router removed from use).
- **Explorer:** two independent panes on desktop (source ↔ destination),
  single pane on mobile. Vertical splitter is drag-to-resize.
- **Terminal dock:** docked at the bottom, collapsible, drag-to-resize
  height, and a fullscreen toggle. The terminal stays mounted when
  collapsed, so the SSH session and scrollback survive.

**Explorer state persists**
- Current paths live in `filesStore` (zustand), so the explorer never
  resets — combined with react-query's cache, you return exactly where you
  were. (Fixes the tab-switch reset.)

**Open terminal here**
- `TerminalView` is now a reusable component exposing an imperative
  `cd(path)`. The explorer's terminal button expands the dock and `cd`s the
  live session into that folder — no navigation, no reconnect.

**Drag and drop (desktop)**
- Drag a row onto the other pane (or onto a folder) → a **Move / Copy**
  chooser. Backend `move` (SFTP rename) and `copy` (stream, files only).
- Cross-filesystem moves and folder copies aren't auto-done — a clear
  message points to the terminal.

**Permissions & ownership**
- A per-row permissions button opens a dialog: chmod via an rwx grid (+
  live octal), and owner/group dropdowns populated from the host's
  `/etc/passwd` and `/etc/group`. Backend `chmod`, `chown`, `owners`.
- `FileEntry` now carries `mode`, `uid`, `gid` (shown inline as the octal).

## New backend endpoints (under `/api/files`)

`POST /move` · `POST /copy` · `POST /chmod` · `POST /chown` · `GET /owners`

## Notes

- No new dependencies. `react-router-dom` and the old `terminalStore`
  (pendingCwd) are now unused and can be pruned later.
- Recursive chmod and folder copy/move stay terminal jobs by design (KISS).
- Symlink sandbox re-validation remains a future hardening step (Phase 4).

## Next: Phase 5 — PWA polish + push wiring.
