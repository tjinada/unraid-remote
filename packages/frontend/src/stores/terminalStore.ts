import { create } from 'zustand';

/**
 * One-shot hand-off between the file explorer and the terminal. When the user
 * taps "Open terminal here", the explorer stashes the directory here and
 * navigates to the terminal, which consumes it on connect and `cd`s into it.
 */
interface TerminalState {
  pendingCwd: string | null;
  setPendingCwd: (path: string | null) => void;
  consumePendingCwd: () => string | null;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  pendingCwd: null,
  setPendingCwd: (path) => set({ pendingCwd: path }),
  consumePendingCwd: () => {
    const v = get().pendingCwd;
    if (v) set({ pendingCwd: null });
    return v;
  },
}));
