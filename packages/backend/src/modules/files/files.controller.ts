import type { Request, Response, NextFunction } from 'express';
import { filesService } from './files.service.js';
import { mkdirSchema, renameSchema, removeSchema, moveSchema, chmodSchema, chownSchema } from './files.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../middleware/index.js';

function asAppError(err: unknown): unknown {
  return err instanceof Error && err.name === 'ZodError' ? new AppError('Invalid request', 400) : err;
}

function queryPath(req: Request): string {
  const v = req.query.path;
  if (typeof v !== 'string' || !v) throw new AppError('path is required', 400);
  return v;
}

export const filesController = {
  roots(_req: Request, res: Response): void {
    sendSuccess(res, filesService.roots());
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await filesService.list(queryPath(req)));
    } catch (err) {
      next(err);
    }
  },

  async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await filesService.preview(queryPath(req)));
    } catch (err) {
      next(err);
    }
  },

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stream, filename } = await filesService.downloadStream(queryPath(req));
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
      stream.on('error', () => {
        if (!res.headersSent) res.status(500);
        res.end();
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dir = queryPath(req);
      const name = typeof req.query.name === 'string' ? req.query.name : '';
      if (!name) throw new AppError('name is required', 400);
      const writable = await filesService.uploadStream(dir, name);
      await new Promise<void>((resolve, reject) => {
        req.on('error', reject);
        writable.on('error', reject);
        writable.on('close', resolve);
        req.pipe(writable);
      });
      sendSuccess(res, { path: dir, name }, 201);
    } catch (err) {
      next(err);
    }
  },

  async mkdir(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { path, name } = mkdirSchema.parse(req.body);
      await filesService.mkdir(path, name);
      sendSuccess(res, { ok: true }, 201);
    } catch (err) {
      next(asAppError(err));
    }
  },

  async rename(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { path, newName } = renameSchema.parse(req.body);
      await filesService.rename(path, newName);
      sendSuccess(res, { ok: true });
    } catch (err) {
      next(asAppError(err));
    }
  },

  async move(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, toDir } = moveSchema.parse(req.body);
      await filesService.move(from, toDir);
      sendSuccess(res, { ok: true });
    } catch (err) {
      next(asAppError(err));
    }
  },

  async copy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, toDir } = moveSchema.parse(req.body);
      await filesService.copy(from, toDir);
      sendSuccess(res, { ok: true });
    } catch (err) {
      next(asAppError(err));
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { path } = removeSchema.parse(req.body);
      await filesService.remove(path);
      sendSuccess(res, { ok: true });
    } catch (err) {
      next(asAppError(err));
    }
  },

  async owners(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await filesService.owners());
    } catch (err) {
      next(err);
    }
  },

  async chmod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { path, mode } = chmodSchema.parse(req.body);
      await filesService.chmod(path, mode);
      sendSuccess(res, { ok: true });
    } catch (err) {
      next(asAppError(err));
    }
  },

  async chown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { path, uid, gid } = chownSchema.parse(req.body);
      await filesService.chown(path, uid, gid);
      sendSuccess(res, { ok: true });
    } catch (err) {
      next(asAppError(err));
    }
  },
};
