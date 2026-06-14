import type { Request, Response } from 'express';
import { getSshStatus } from './ssh.service.js';
import { sendSuccess } from '../../utils/response.js';

export const sshController = {
  status(_req: Request, res: Response): void {
    sendSuccess(res, getSshStatus());
  },
};
