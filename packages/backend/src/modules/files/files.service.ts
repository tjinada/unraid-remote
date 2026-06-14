import path from 'node:path';
import type { Readable, Writable } from 'node:stream';
import type { Client, SFTPWrapper, Stats } from 'ssh2';
import type { FileEntry, FileType, Owners } from '@unraidpwa/shared';
import { connectClient } from '../ssh/index.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/index.js';

const p = path.posix; // remote host is Linux — never use Windows path semantics

// ── Cached SFTP connection ─────────────────────────────────────────────────
let cached: { client: Client; sftp: SFTPWrapper } | null = null;

async function getSftp(): Promise<SFTPWrapper> {
  if (cached) return cached.sftp;
  const client = await connectClient();
  const sftp = await new Promise<SFTPWrapper>((resolve, reject) => {
    client.sftp((err, s) => (err ? reject(err) : resolve(s)));
  });
  const holder = { client, sftp };
  cached = holder;
  const clear = () => {
    if (cached === holder) cached = null;
  };
  client.on('close', clear).on('end', clear).on('error', clear);
  return sftp;
}

// ── Path safety ────────────────────────────────────────────────────────────
function safeResolve(input: string): string {
  if (!input || !input.startsWith('/')) throw new AppError('Invalid path', 400);
  const resolved = p.normalize(input); // collapses ".." before the check
  const ok = config.allowedRoots.some((root) => {
    const r = p.normalize(root);
    return resolved === r || resolved.startsWith(r.endsWith('/') ? r : `${r}/`);
  });
  if (!ok) throw new AppError('Path is outside the allowed roots', 403);
  return resolved;
}

function validateName(name: string): void {
  if (!name || name.includes('/') || name === '.' || name === '..') {
    throw new AppError('Invalid name', 400);
  }
}

function typeOf(stats: Stats): FileType {
  if (stats.isDirectory()) return 'directory';
  if (stats.isSymbolicLink()) return 'symlink';
  if (stats.isFile()) return 'file';
  return 'other';
}

// Tiny promisified SFTP helpers
const stat = (s: SFTPWrapper, f: string) => new Promise<Stats>((res, rej) => s.stat(f, (e, r) => (e ? rej(e) : res(r))));
const lstat = (s: SFTPWrapper, f: string) => new Promise<Stats>((res, rej) => s.lstat(f, (e, r) => (e ? rej(e) : res(r))));
const readText = (s: SFTPWrapper, f: string) =>
  new Promise<string>((res, rej) => s.readFile(f, (e, d) => (e ? rej(e) : res(d.toString('utf8')))));

const MAX_PREVIEW = 1024 * 1024; // 1 MB

function parseColonFile(text: string): string[][] {
  return text
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(':'));
}

export const filesService = {
  roots(): string[] {
    return [...config.allowedRoots];
  },

  async list(rawPath: string): Promise<{ path: string; entries: FileEntry[] }> {
    const dir = safeResolve(rawPath);
    const sftp = await getSftp();
    const list = await new Promise<Array<{ filename: string; attrs: Stats }>>((resolve, reject) => {
      sftp.readdir(dir, (err, l) => (err ? reject(err) : resolve(l as never)));
    });
    const entries: FileEntry[] = list.map((e) => ({
      name: e.filename,
      path: p.join(dir, e.filename),
      type: typeOf(e.attrs),
      size: e.attrs.size,
      modified: (e.attrs.mtime ?? 0) * 1000,
      mode: e.attrs.mode & 0o777,
      uid: e.attrs.uid,
      gid: e.attrs.gid,
    }));
    entries.sort((a, b) => {
      const ad = a.type === 'directory' ? 0 : 1;
      const bd = b.type === 'directory' ? 0 : 1;
      return ad - bd || a.name.localeCompare(b.name);
    });
    return { path: dir, entries };
  },

  async preview(rawPath: string): Promise<{ path: string; content: string; size: number }> {
    const file = safeResolve(rawPath);
    const sftp = await getSftp();
    const stats = await stat(sftp, file);
    if (stats.isDirectory()) throw new AppError('Not a file', 400);
    if (stats.size > MAX_PREVIEW) throw new AppError('File too large to preview — download instead', 413);
    const buf = await new Promise<Buffer>((res, rej) => sftp.readFile(file, (e, d) => (e ? rej(e) : res(d))));
    if (buf.includes(0)) throw new AppError('Binary file — download instead', 415);
    return { path: file, content: buf.toString('utf8'), size: stats.size };
  },

  async downloadStream(rawPath: string): Promise<{ stream: Readable; filename: string }> {
    const file = safeResolve(rawPath);
    const sftp = await getSftp();
    return { stream: sftp.createReadStream(file), filename: p.basename(file) };
  },

  async uploadStream(rawDir: string, name: string): Promise<Writable> {
    validateName(name);
    const dir = safeResolve(rawDir);
    const target = safeResolve(p.join(dir, name));
    const sftp = await getSftp();
    return sftp.createWriteStream(target);
  },

  async mkdir(rawParent: string, name: string): Promise<void> {
    validateName(name);
    const target = safeResolve(p.join(safeResolve(rawParent), name));
    const sftp = await getSftp();
    await new Promise<void>((res, rej) => sftp.mkdir(target, (e) => (e ? rej(e) : res())));
  },

  async rename(rawPath: string, newName: string): Promise<void> {
    validateName(newName);
    const from = safeResolve(rawPath);
    const to = safeResolve(p.join(p.dirname(from), newName));
    const sftp = await getSftp();
    await new Promise<void>((res, rej) => sftp.rename(from, to, (e) => (e ? rej(e) : res())));
  },

  async move(rawFrom: string, rawToDir: string): Promise<void> {
    const from = safeResolve(rawFrom);
    const target = safeResolve(p.join(safeResolve(rawToDir), p.basename(from)));
    if (from === target) return;
    const sftp = await getSftp();
    await new Promise<void>((res, rej) =>
      sftp.rename(from, target, (e) =>
        e ? rej(new AppError('Move failed (possibly across filesystems) — use the terminal', 400)) : res(),
      ),
    );
  },

  async copy(rawFrom: string, rawToDir: string): Promise<void> {
    const from = safeResolve(rawFrom);
    const target = safeResolve(p.join(safeResolve(rawToDir), p.basename(from)));
    if (from === target) throw new AppError('Source and destination are the same', 400);
    const sftp = await getSftp();
    const stats = await stat(sftp, from);
    if (stats.isDirectory()) throw new AppError('Copying folders isn\u2019t supported — use the terminal', 400);
    await new Promise<void>((resolve, reject) => {
      const rs = sftp.createReadStream(from);
      const ws = sftp.createWriteStream(target);
      rs.on('error', reject);
      ws.on('error', reject);
      ws.on('close', resolve);
      rs.pipe(ws);
    });
  },

  async remove(rawPath: string): Promise<void> {
    const target = safeResolve(rawPath);
    const sftp = await getSftp();
    const stats = await lstat(sftp, target);
    if (stats.isDirectory()) {
      await new Promise<void>((res, rej) =>
        sftp.rmdir(target, (e) => (e ? rej(new AppError('Directory not empty — clear it or use the terminal', 400)) : res())),
      );
    } else {
      await new Promise<void>((res, rej) => sftp.unlink(target, (e) => (e ? rej(e) : res())));
    }
  },

  async chmod(rawPath: string, mode: number): Promise<void> {
    const file = safeResolve(rawPath);
    const sftp = await getSftp();
    await new Promise<void>((res, rej) => sftp.chmod(file, mode, (e) => (e ? rej(e) : res())));
  },

  async chown(rawPath: string, uid: number, gid: number): Promise<void> {
    const file = safeResolve(rawPath);
    const sftp = await getSftp();
    await new Promise<void>((res, rej) => sftp.chown(file, uid, gid, (e) => (e ? rej(e) : res())));
  },

  async owners(): Promise<Owners> {
    const sftp = await getSftp();
    // Fixed system paths (not user-supplied), so sandbox does not apply.
    const [passwd, group] = await Promise.all([readText(sftp, '/etc/passwd'), readText(sftp, '/etc/group')]);
    const users = parseColonFile(passwd)
      .map((f) => ({ name: f[0], id: Number(f[2]) }))
      .filter((u) => Number.isFinite(u.id));
    const groups = parseColonFile(group)
      .map((f) => ({ name: f[0], id: Number(f[2]) }))
      .filter((g) => Number.isFinite(g.id));
    return { users, groups };
  },
};
