# Phase 3 — Command Shortcuts

**Status:** complete. Tappable, editable command shortcuts surfaced in a
drawer inside the terminal, persisted to a plain JSON file.

## What this phase delivers

**Backend (`shortcuts` module)**
- JSON-backed CRUD using the Phase-1 `JsonStore` primitive
  (`data/shortcuts.json`), seeded with safe defaults on first run.
- Endpoints (all auth-guarded):
  - `GET    /api/shortcuts`        — list
  - `POST   /api/shortcuts`        — create
  - `PUT    /api/shortcuts/:id`    — update
  - `DELETE /api/shortcuts/:id`    — delete
- The store is loaded before the server starts accepting requests.

**Frontend (`shortcuts` feature)**
- `useShortcuts` / `useShortcutMutations` — react-query hooks.
- `ShortcutsDrawer` — a bottom sheet in the terminal with two modes:
  - **Use:** shortcuts grouped by category; tap to run (▶) or insert (⏎).
  - **Manage:** add / edit / delete via `ShortcutForm`.
- A "Shortcuts" button in the terminal status bar opens the drawer.

## Data model

```ts
interface Shortcut {
  id: string;
  label: string;          // "List containers"
  command: string;        // "docker ps"
  category: string;       // "Docker"
  runImmediately: boolean; // true = send + Enter, false = insert into prompt
}
```

## Behaviour notes

- **Run vs insert:** "run immediately" sends `command + \r` (Enter);
  otherwise the command is typed into the prompt for the user to edit and
  submit. Insert is the safe choice for destructive or parameterised
  commands.
- **Seeds are non-destructive** (`docker ps`, `df -h`, `mdcmd status`,
  `mover status`, `uptime`, `free -h`, `tail -f /var/log/syslog`, …).
  Deleting them sticks — defaults are only seeded when no file exists.
- Users can add their own commands, including dangerous ones, deliberately.

## Run

```bash
pnpm dev
```
Open the terminal, tap **Shortcuts**, and either fire a default or hit the
pencil to manage your own.

## Next: Phase 4 — file/folder explorer (SFTP CRUD + path sandboxing).
