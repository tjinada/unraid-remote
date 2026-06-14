# Phase 4 — File / Folder Explorer (SFTP)

**Status:** complete. Browse, preview, download, upload, create, rename and
delete files on the unraid host over SFTP — all sandboxed to `ALLOWED_ROOTS`
— plus "Open terminal here".

## What this phase delivers

**Backend (`files` module)**
- SFTP operations over a **cached** SSH connection (reused across requests,
  auto-cleared on close/error). The SSH client factory was refactored into
  `connectClient()` and is shared by the terminal and SFTP.
- **Path sandboxing:** every path is normalised with `path.posix` (so `..`
  is collapsed before checking) and must fall within one of `ALLOWED_ROOTS`,
  else `403`. POSIX semantics are used regardless of the server's OS.
- Endpoints (all auth-guarded, under `/api/files`):
  - `GET  /roots`                 — configured allowed roots
  - `GET  /list?path=`            — directory listing (dirs first)
  - `GET  /preview?path=`         — text preview (≤1 MB, binary rejected)
  - `GET  /download?path=`        — streamed download
  - `POST /upload?path=&name=`    — streamed upload (raw body → SFTP)
  - `POST /mkdir` · `/rename` · `/remove`

**Frontend (`files` feature)**
- `FilesPage` — a root chooser (when several roots), then a directory view
  with an up button, breadcrumb, new-folder, upload, and an "Open terminal
  here" button. Tap a folder to enter, a file to preview.
- `FilePreview` — text viewer with a download fallback for binary/large files.
- `NameDialog` — shared dialog for new-folder and rename.
- The **Files** bottom-nav tab is now enabled.

## "Open terminal here"

Tapping the terminal icon in the explorer stashes the current directory in a
small zustand store (`terminalStore`) and navigates to the Terminal tab. The
terminal consumes it on connect and runs `cd '<dir>'` (single-quote-escaped),
dropping you straight into that folder.

## Safety notes

- **Sandbox:** access is confined to `ALLOWED_ROOTS` (default
  `/mnt/user,/boot`). `..` traversal is neutralised before validation.
- **Symlinks** are followed by SFTP and are *not* separately re-checked
  against the sandbox — a deliberate symlink could point outside a root.
  Noted as a future hardening step (resolve + re-validate real paths).
- **Delete** removes files and *empty* directories only; a non-empty folder
  returns a clear error suggesting the terminal (no recursive delete).
- Uploads stream straight to SFTP (no server-side buffering), so large files
  are fine.

## Run

No new dependencies. With `SSH_*` set in `.env`:

```bash
pnpm dev
```
Open the **Files** tab, browse, and try the terminal-here button.

## Next: Phase 5 — PWA polish + push notification wiring (VAPID + subscribe).
