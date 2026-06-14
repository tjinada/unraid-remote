import { z } from 'zod';

export const shortcutInputSchema = z.object({
  label: z.string().min(1).max(60),
  command: z.string().min(1).max(2000),
  category: z.string().min(1).max(40),
  runImmediately: z.boolean(),
});

export type ShortcutInputDto = z.infer<typeof shortcutInputSchema>;
