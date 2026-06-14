import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Shortcut, ShortcutInput } from '@unraidpwa/shared';
import { api } from '@/api/client';

const KEY = ['shortcuts'];

export function useShortcuts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Shortcut[]>>('/shortcuts');
      return res.data.data ?? [];
    },
  });
}

export function useShortcutMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: ShortcutInput) => api.post('/shortcuts', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ShortcutInput }) =>
      api.put(`/shortcuts/${id}`, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/shortcuts/${id}`),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
