import { Router } from 'express';
import { sshController } from './ssh.controller.js';
import { requireAuth } from '../../middleware/index.js';

const router: Router = Router();

router.get('/status', requireAuth, sshController.status);

export const sshRoutes = router;
