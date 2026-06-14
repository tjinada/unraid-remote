import type { Shortcut } from '@unraidpwa/shared';
import { JsonStore } from '../../store/jsonStore.js';
import { DEFAULT_SHORTCUTS } from './shortcuts.defaults.js';

interface ShortcutsData {
  shortcuts: Shortcut[];
}

/** Single JSON-backed store for command shortcuts. Seeds defaults on first run. */
export const shortcutsStore = new JsonStore<ShortcutsData>('shortcuts.json', {
  shortcuts: DEFAULT_SHORTCUTS,
});

export function initShortcuts(): Promise<void> {
  return shortcutsStore.load();
}
