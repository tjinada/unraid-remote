import { useState } from 'react';
import type { Shortcut, ShortcutInput } from '@unraidpwa/shared';

interface Props {
  initial?: Shortcut;
  onSubmit: (input: ShortcutInput) => void;
  onCancel: () => void;
  busy?: boolean;
}

const inputCls =
  'w-full rounded-lg border border-border bg-base px-3 py-2 text-sm outline-none focus:border-primary-500';

export function ShortcutForm({ initial, onSubmit, onCancel, busy }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [command, setCommand] = useState(initial?.command ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Custom');
  const [runImmediately, setRunImmediately] = useState(initial?.runImmediately ?? true);

  const valid = label.trim() && command.trim() && category.trim();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <input className={inputCls} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className={`${inputCls} font-mono`} placeholder="Command" value={command} onChange={(e) => setCommand(e.target.value)} />
      <input className={inputCls} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={runImmediately}
          onChange={(e) => setRunImmediately(e.target.checked)}
          className="h-4 w-4 accent-primary-600"
        />
        Run immediately (otherwise insert into prompt)
      </label>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          disabled={!valid || busy}
          onClick={() => onSubmit({ label: label.trim(), command: command.trim(), category: category.trim(), runImmediately })}
          className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {initial ? 'Save' : 'Add'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm text-gray-300">
          Cancel
        </button>
      </div>
    </div>
  );
}
