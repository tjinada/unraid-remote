import { randomUUID } from 'node:crypto';
import type { Shortcut, ShortcutInput } from '@unraidpwa/shared';
import { shortcutsStore } from './shortcuts.store.js';
import { AppError } from '../../middleware/index.js';

export const shortcutsService = {
  list(): Shortcut[] {
    return shortcutsStore.get().shortcuts;
  },

  async create(input: ShortcutInput): Promise<Shortcut> {
    const shortcut: Shortcut = { id: randomUUID(), ...input };
    await shortcutsStore.update((d) => ({ shortcuts: [...d.shortcuts, shortcut] }));
    return shortcut;
  },

  async update(id: string, input: ShortcutInput): Promise<Shortcut> {
    const existing = shortcutsStore.get().shortcuts.find((s) => s.id === id);
    if (!existing) throw new AppError('Shortcut not found', 404);

    const updated: Shortcut = { id, ...input };
    await shortcutsStore.update((d) => ({
      shortcuts: d.shortcuts.map((s) => (s.id === id ? updated : s)),
    }));
    return updated;
  },

  async remove(id: string): Promise<void> {
    const exists = shortcutsStore.get().shortcuts.some((s) => s.id === id);
    if (!exists) throw new AppError('Shortcut not found', 404);
    await shortcutsStore.update((d) => ({ shortcuts: d.shortcuts.filter((s) => s.id !== id) }));
  },
};
