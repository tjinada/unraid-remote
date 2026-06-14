import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, FileListResult, FilePreview } from '@unraidpwa/shared';
import { api } from '@/api/client';

export function useRoots() {
  return useQuery({
    queryKey: ['file-roots'],
    queryFn: async () => {
      const r = await api.get<ApiResponse<string[]>>('/files/roots');
      return r.data.data ?? [];
    },
  });
}

export function useFileList(path: string | null) {
  return useQuery({
    queryKey: ['files', path],
    enabled: !!path,
    queryFn: async () => {
      const r = await api.get<ApiResponse<FileListResult>>('/files/list', { params: { path } });
      return r.data.data as FileListResult;
    },
  });
}

export function useFileMutations(currentPath: string | null) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['files', currentPath] });

  const mkdir = useMutation({
    mutationFn: (name: string) => api.post('/files/mkdir', { path: currentPath, name }),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: (vars: { path: string; newName: string }) => api.post('/files/rename', vars),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (path: string) => api.post('/files/remove', { path }),
    onSuccess: invalidate,
  });
  return { mkdir, rename, remove };
}

export async function previewFile(path: string): Promise<FilePreview> {
  const r = await api.get<ApiResponse<FilePreview>>('/files/preview', { params: { path } });
  return r.data.data as FilePreview;
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const r = await api.get('/files/download', { params: { path }, responseType: 'blob' });
  const url = URL.createObjectURL(r.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadFile(dir: string, file: File): Promise<void> {
  await api.post('/files/upload', file, {
    params: { path: dir, name: file.name },
    headers: { 'Content-Type': 'application/octet-stream' },
  });
}

// ── Files Workspace v2: move / copy / permissions ──────────────────────────
import type { Owners } from '@unraidpwa/shared';

export function useOwners() {
  return useQuery({
    queryKey: ['file-owners'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Owners>>('/files/owners');
      return r.data.data as Owners;
    },
  });
}

export async function moveEntry(from: string, toDir: string): Promise<void> {
  await api.post('/files/move', { from, toDir });
}

export async function copyEntry(from: string, toDir: string): Promise<void> {
  await api.post('/files/copy', { from, toDir });
}

export async function chmodEntry(path: string, mode: number): Promise<void> {
  await api.post('/files/chmod', { path, mode });
}

export async function chownEntry(path: string, uid: number, gid: number): Promise<void> {
  await api.post('/files/chown', { path, uid, gid });
}
