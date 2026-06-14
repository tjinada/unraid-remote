import { z } from 'zod';

export const mkdirSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1).max(255),
});

export const renameSchema = z.object({
  path: z.string().min(1),
  newName: z.string().min(1).max(255),
});

export const removeSchema = z.object({
  path: z.string().min(1),
});

export const moveSchema = z.object({
  from: z.string().min(1),
  toDir: z.string().min(1),
});

export const chmodSchema = z.object({
  path: z.string().min(1),
  mode: z.number().int().min(0).max(0o777),
});

export const chownSchema = z.object({
  path: z.string().min(1),
  uid: z.number().int().min(0),
  gid: z.number().int().min(0),
});
