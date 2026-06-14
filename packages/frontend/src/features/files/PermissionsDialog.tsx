import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { FileEntry } from '@unraidpwa/shared';
import { useOwners, chmodEntry, chownEntry } from './useFiles';

const ROWS = [
  { label: 'Owner', shift: 6 },
  { label: 'Group', shift: 3 },
  { label: 'Other', shift: 0 },
];
const BITS = [
  { label: 'r', val: 4 },
  { label: 'w', val: 2 },
  { label: 'x', val: 1 },
];

interface Props {
  entry: FileEntry;
  onClose: () => void;
  onSaved: () => void;
}

export function PermissionsDialog({ entry, onClose, onSaved }: Props) {
  const { data: owners } = useOwners();
  const [mode, setMode] = useState(entry.mode);
  const [uid, setUid] = useState(entry.uid);
  const [gid, setGid] = useState(entry.gid);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const octal = mode.toString(8).padStart(3, '0');

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode !== entry.mode) await chmodEntry(entry.path, mode);
      if (uid !== entry.uid || gid !== entry.gid) await chownEntry(entry.path, uid, gid);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to apply');
    } finally {
      setBusy(false);
    }
  };

  const users = owners?.users ?? [];
  const groups = owners?.groups ?? [];
  const selCls = 'rounded-lg border border-border bg-base px-2 py-2 text-sm outline-none focus:border-primary-500';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{entry.name}</span>
          <span className="rounded bg-base px-2 py-0.5 font-mono text-xs text-primary-500">{octal}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-border">
            <X className="h-5 w-5" />
          </button>
        </div>

        <table className="mb-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="text-left font-normal" />
              {BITS.map((b) => <th key={b.label} className="font-normal">{b.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td className="py-1 text-gray-300">{row.label}</td>
                {BITS.map((b) => {
                  const bit = b.val << row.shift;
                  return (
                    <td key={b.label} className="py-1 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary-600"
                        checked={(mode & bit) !== 0}
                        onChange={() => setMode((m) => m ^ bit)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-gray-400">
            Owner
            <select className={selCls} value={uid} onChange={(e) => setUid(Number(e.target.value))}>
              {!users.some((u) => u.id === uid) && <option value={uid}>uid {uid}</option>}
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-400">
            Group
            <select className={selCls} value={gid} onChange={(e) => setGid(Number(e.target.value))}>
              {!groups.some((g) => g.id === gid) && <option value={gid}>gid {gid}</option>}
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        </div>

        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
