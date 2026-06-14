import type { Request, Response, NextFunction } from 'express';
import { shortcutsService } from './shortcuts.service.js';
import { shortcutInputSchema } from './shortcuts.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../middleware/index.js';

function asAppError(err: unknown): unknown {
  return err instanceof Error && err.name === 'ZodError' ? new AppError('Invalid shortcut', 400) : err;
}

export const shortcutsController = {
  list(_req: Request, res: Response): void {
    sendSuccess(res, shortcutsService.list());
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = shortcutInputSchema.parse(req.body);
      sendSuccess(res, await shortcutsService.create(input), 201);
    } catch (err) {
      next(asAppError(err));
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = shortcutInputSchema.parse(req.body);
      sendSuccess(res, await shortcutsService.update(req.params.id, input));
    } catch (err) {
      next(asAppError(err));
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await shortcutsService.remove(req.params.id);
      sendSuccess(res, { id: req.params.id });
    } catch (err) {
      next(err);
    }
  },
};
