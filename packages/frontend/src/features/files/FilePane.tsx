import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Folder, File as FileIcon, ArrowUp, FolderPlus, Upload, Terminal,
  Download, Pencil, Trash2, Loader2, HardDrive, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import type { FileEntry } from '@unraidpwa/shared';
import { useRoots, useFileList, useFileMutations, downloadFile, uploadFile } from './useFiles';
import { FilePreview } from './FilePreview';
import { NameDialog } from './NameDialog';
import { PermissionsDialog } from './PermissionsDialog';

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let n = b / 1024;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

interface Props {
  path: string | null;
  setPath: (path: string | null) => void;
  onOpenTerminalHere: (path: string) => void;
  onDropEntry: (fromPath: string, toDir: string) => void;
}

export function FilePane({ path, setPath, onOpenTerminalHere, onDropEntry }: Props) {
  const qc = useQueryClient();
  const { data: roots = [] } = useRoots();
  const { data, isLoading, isError, error } = useFileList(path);
  const { mkdir, rename, remove } = useFileMutations(path);

  const [preview, setPreview] = useState<{ path: string; filename: string } | null>(null);
  const [perms, setPerms] = useState<FileEntry | null>(null);
  const [dialog, setDialog] = useState<{ mode: 'mkdir' } | { mode: 'rename'; entry: FileEntry } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (path === null && roots.length === 1) setPath(roots[0]);
  }, [roots, path, setPath]);

  const goUp = () => {
    if (!path) return;
    if (roots.includes(path)) { setPath(null); return; }
    const i = path.lastIndexOf('/');
    setPath(i > 0 ? path.slice(0, i) : '/');
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || !path) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await uploadFile(path, f);
      qc.invalidateQueries({ queryKey: ['files', path] });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const del = (entry: FileEntry) => {
    if (window.confirm(`Delete "${entry.name}"?`)) remove.mutate(entry.path);
  };

  const startDrag = (entry: FileEntry) => (e: DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ path: entry.path }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };
  const dropTo = (toDir: string) => (e: DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    try {
      const { path: from } = JSON.parse(e.dataTransfer.getData('application/json')) as { path: string };
      if (from) onDropEntry(from, toDir);
    } catch {
      /* ignore */
    }
  };
  const allowDrop = (e: DragEvent) => e.preventDefault();

  // ── Root chooser ──────────────────────────────────────────────────────────
  if (path === null) {
    return (
      <div className="h-full overflow-y-auto p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Locations</p>
        <div className="flex flex-col gap-2">
          {roots.map((r) => (
            <button key={r} type="button" onClick={() => setPath(r)} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left hover:border-primary-500">
              <HardDrive className="h-5 w-5 text-primary-500" />
              <span className="font-mono text-sm">{r}</span>
              <ChevronRight className="ml-auto h-4 w-4 text-gray-500" />
            </button>
          ))}
          {roots.length === 0 && (
            <p className="mt-8 text-center text-sm text-gray-500">
              No locations. Set <code className="text-primary-500">ALLOWED_ROOTS</code> and restart.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Directory view ────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
        <button type="button" onClick={goUp} aria-label="Up" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-border">
          <ArrowUp className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate px-1 font-mono text-xs text-gray-400" dir="rtl">{path}</span>
        <button type="button" onClick={() => setDialog({ mode: 'mkdir' })} aria-label="New folder" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-border">
          <FolderPlus className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} aria-label="Upload" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-border">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => onOpenTerminalHere(path)} aria-label="Open terminal here" className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-500 hover:bg-border">
          <Terminal className="h-4 w-4" />
        </button>
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto ${dropActive ? 'bg-primary-600/5' : ''}`}
        onDragOver={(e) => { allowDrop(e); setDropActive(true); }}
        onDragLeave={() => setDropActive(false)}
        onDrop={dropTo(path)}
      >
        {isLoading && <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-gray-500" />}
        {isError && (
          <p className="p-6 text-center text-sm text-red-400">
            {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'}
          </p>
        )}
        {data?.entries.map((entry) => {
          const isDir = entry.type === 'directory' || entry.type === 'symlink';
          return (
            <div
              key={entry.path}
              draggable
              onDragStart={startDrag(entry)}
              onDragOver={isDir ? allowDrop : undefined}
              onDrop={isDir ? dropTo(entry.path) : undefined}
              className="flex items-center gap-2 border-b border-border/50 px-3 py-2"
            >
              <button type="button" onClick={() => (isDir ? setPath(entry.path) : setPreview({ path: entry.path, filename: entry.name }))} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                {isDir ? <Folder className="h-5 w-5 flex-shrink-0 text-primary-500" /> : <FileIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{entry.name}</span>
                  <span className="block font-mono text-[10px] text-gray-500">
                    {entry.mode.toString(8).padStart(3, '0')}{!isDir && ` · ${fmtSize(entry.size)}`}
                  </span>
                </span>
              </button>
              <button type="button" onClick={() => setPerms(entry)} aria-label="Permissions" className="text-gray-400 hover:text-gray-200">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {!isDir && (
                <button type="button" onClick={() => downloadFile(entry.path, entry.name)} aria-label="Download" className="text-gray-400 hover:text-gray-200">
                  <Download className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={() => setDialog({ mode: 'rename', entry })} aria-label="Rename" className="text-gray-400 hover:text-gray-200">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => del(entry)} aria-label="Delete" className="text-gray-400 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {data && data.entries.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Empty folder</p>}
      </div>

      {preview && <FilePreview path={preview.path} filename={preview.filename} onClose={() => setPreview(null)} />}
      {perms && <PermissionsDialog entry={perms} onClose={() => setPerms(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['files', path] })} />}

      {dialog?.mode === 'mkdir' && (
        <NameDialog title="New folder" submitLabel="Create" busy={mkdir.isPending} onCancel={() => setDialog(null)} onSubmit={(name) => mkdir.mutate(name, { onSuccess: () => setDialog(null) })} />
      )}
      {dialog?.mode === 'rename' && (
        <NameDialog title="Rename" initial={dialog.entry.name} submitLabel="Rename" busy={rename.isPending} onCancel={() => setDialog(null)} onSubmit={(newName) => rename.mutate({ path: dialog.entry.path, newName }, { onSuccess: () => setDialog(null) })} />
      )}
    </div>
  );
}
