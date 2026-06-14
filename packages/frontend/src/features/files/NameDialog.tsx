import { useState } from 'react';

interface Props {
  title: string;
  initial?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  busy?: boolean;
}

export function NameDialog({ title, initial = '', submitLabel = 'OK', onSubmit, onCancel, busy }: Props) {
  const [value, setValue] = useState(initial);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-4">
        <h3 className="mb-3 font-semibold">{title}</h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSubmit(value.trim())}
          className="w-full rounded-lg border border-border bg-base px-3 py-2 text-sm outline-none focus:border-primary-500"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!value.trim() || busy}
            onClick={() => onSubmit(value.trim())}
            className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitLabel}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm text-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
