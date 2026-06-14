import { useMemo, useState } from 'react';
import { X, Pencil, Plus, Play, CornerDownLeft, Trash2 } from 'lucide-react';
import type { Shortcut, ShortcutInput } from '@unraidpwa/shared';
import { useShortcuts, useShortcutMutations } from './useShortcuts';
import { ShortcutForm } from './ShortcutForm';

interface Props {
  open: boolean;
  onClose: () => void;
  onUse: (command: string, runImmediately: boolean) => void;
}

export function ShortcutsDrawer({ open, onClose, onUse }: Props) {
  const { data: shortcuts = [], isLoading } = useShortcuts();
  const { create, update, remove } = useShortcutMutations();
  const [manage, setManage] = useState(false);
  const [editing, setEditing] = useState<Shortcut | 'new' | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Shortcut[]>();
    for (const s of shortcuts) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return [...map.entries()];
  }, [shortcuts]);

  if (!open) return null;

  const submit = (input: ShortcutInput) => {
    if (editing === 'new') create.mutate(input, { onSuccess: () => setEditing(null) });
    else if (editing) update.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button type="button" aria-label="Close" className="flex-1 bg-black/50" onClick={onClose} />

      <div className="max-h-[75%] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Shortcuts</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setManage((m) => !m); setEditing(null); }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${manage ? 'text-primary-500' : 'text-gray-400'} hover:bg-border`}
              aria-label="Edit shortcuts"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-border">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading && <p className="py-6 text-center text-sm text-gray-500">Loading…</p>}

        {editing && (
          <ShortcutForm
            initial={editing === 'new' ? undefined : editing}
            onSubmit={submit}
            onCancel={() => setEditing(null)}
            busy={create.isPending || update.isPending}
          />
        )}

        {!editing && manage && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-gray-300 hover:border-primary-500"
            >
              <Plus className="h-4 w-4" /> Add shortcut
            </button>
            {shortcuts.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-base px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{s.label}</p>
                  <p className="truncate font-mono text-xs text-gray-500">{s.command}</p>
                </div>
                <button type="button" onClick={() => setEditing(s)} aria-label="Edit" className="text-gray-400 hover:text-gray-200">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove.mutate(s.id)} aria-label="Delete" className="text-gray-400 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!editing && !manage && (
          <div className="flex flex-col gap-3">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { onUse(s.command, s.runImmediately); onClose(); }}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-base px-3 py-2 text-sm hover:border-primary-500"
                    >
                      {s.runImmediately ? <Play className="h-3.5 w-3.5 text-primary-500" /> : <CornerDownLeft className="h-3.5 w-3.5 text-gray-500" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!isLoading && shortcuts.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">No shortcuts yet. Tap the pencil to add one.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
