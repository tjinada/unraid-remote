import type { PointerEvent } from 'react';

interface KeyDef {
  label: string;
  seq: string;
}

// Keys that phone keyboards lack or make awkward. Sent as raw byte sequences.
const KEYS: KeyDef[] = [
  { label: 'Esc', seq: '\x1b' },
  { label: 'Tab', seq: '\t' },
  { label: '^C', seq: '\x03' },
  { label: '^D', seq: '\x04' },
  { label: '^L', seq: '\x0c' },
  { label: '↑', seq: '\x1b[A' },
  { label: '↓', seq: '\x1b[B' },
  { label: '←', seq: '\x1b[D' },
  { label: '→', seq: '\x1b[C' },
  { label: '|', seq: '|' },
  { label: '~', seq: '~' },
  { label: '/', seq: '/' },
  { label: '-', seq: '-' },
];

export function AccessoryBar({ onKey }: { onKey: (seq: string) => void }) {
  // Use pointerdown + preventDefault so tapping a key never steals focus
  // from the terminal (which would dismiss the on-screen keyboard).
  const handle = (seq: string) => (e: PointerEvent) => {
    e.preventDefault();
    onKey(seq);
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto border-t border-border bg-surface px-2 py-2">
      {KEYS.map((k) => (
        <button
          key={k.label}
          type="button"
          onPointerDown={handle(k.seq)}
          className="min-h-[36px] flex-shrink-0 rounded-md border border-border bg-base px-3 font-mono text-xs text-gray-200 active:bg-primary-600 active:text-white"
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
