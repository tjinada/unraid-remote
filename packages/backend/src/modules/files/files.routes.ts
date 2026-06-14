import { Router } from 'express';
import { filesController } from './files.controller.js';
import { requireAuth } from '../../middleware/index.js';

const router: Router = Router();

router.use(requireAuth);
router.get('/roots', filesController.roots);
router.get('/list', filesController.list);
router.get('/preview', filesController.preview);
router.get('/download', filesController.download);
router.get('/owners', filesController.owners);
router.post('/upload', filesController.upload);
router.post('/mkdir', filesController.mkdir);
router.post('/rename', filesController.rename);
router.post('/move', filesController.move);
router.post('/copy', filesController.copy);
router.post('/remove', filesController.remove);
router.post('/chmod', filesController.chmod);
router.post('/chown', filesController.chown);

export const filesRoutes = router;
