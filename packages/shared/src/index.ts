/**
 * Shared types used by both backend and frontend.
 * Phase 1: auth + the API response envelope. More types (files,
 * shortcuts, terminal WS protocol) are added in their phases.
 */

/** Standard API envelope returned by every backend endpoint. */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/** The single application user (no roles, no registration). */
export interface AuthUser {
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

// ── Terminal WebSocket protocol (Phase 2) ──────────────────────────────────
// Endpoint: /ws/terminal?token=<jwt>&cols=<n>&rows=<n>
// Both directions are JSON-encoded messages.

/** Messages the browser sends to the server. */
export type TerminalClientMessage =
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number };

/** Messages the server sends to the browser. */
export type TerminalServerMessage =
  | { type: 'output'; data: string }
  | { type: 'status'; status: 'connecting' | 'connected' }
  | { type: 'error'; message: string }
  | { type: 'exit'; code: number | null };

/** Non-secret SSH status returned by GET /api/ssh/status. */
export interface SshStatus {
  configured: boolean;
  target: string | null;
}

// ── Command shortcuts (Phase 3) ────────────────────────────────────────────

export interface Shortcut {
  id: string;
  label: string;          // display name, e.g. "List containers"
  command: string;        // the command text, e.g. "docker ps"
  category: string;       // grouping, e.g. "Docker"
  runImmediately: boolean; // true = send + Enter; false = insert into the prompt
}

/** Payload for creating/updating a shortcut (server assigns the id). */
export type ShortcutInput = Omit<Shortcut, 'id'>;

// ── File explorer (Phase 4) ────────────────────────────────────────────────

export type FileType = 'file' | 'directory' | 'symlink' | 'other';

export interface FileEntry {
  name: string;
  path: string;       // full POSIX path on the remote host
  type: FileType;
  size: number;       // bytes
  modified: number;   // epoch milliseconds
  mode: number;       // permission bits only, e.g. 0o755
  uid: number;
  gid: number;
}

export interface FileListResult {
  path: string;
  entries: FileEntry[];
}

export interface FilePreview {
  path: string;
  content: string;
  size: number;
}

// ── Owners / groups (Files Workspace v2) ───────────────────────────────────

export interface OwnerEntry {
  name: string;
  id: number;
}

export interface Owners {
  users: OwnerEntry[];
  groups: OwnerEntry[];
}
