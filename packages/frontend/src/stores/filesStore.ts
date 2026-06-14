import { create } from 'zustand';

/**
 * Persistent explorer state for the workspace. Lives outside the component
 * tree so navigating away/back never resets where you were. Two independent
 * panes (left = source, right = destination) for drag-and-drop moves.
 */
interface FilesState {
  leftPath: string | null;
  rightPath: string | null;
  setLeftPath: (path: string | null) => void;
  setRightPath: (path: string | null) => void;
}

export const useFilesStore = create<FilesState>((set) => ({
  leftPath: null,
  rightPath: null,
  setLeftPath: (path) => set({ leftPath: path }),
  setRightPath: (path) => set({ rightPath: path }),
}));
