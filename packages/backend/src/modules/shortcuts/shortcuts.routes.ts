import { Router } from 'express';
import { shortcutsController } from './shortcuts.controller.js';
import { requireAuth } from '../../middleware/index.js';

const router: Router = Router();

router.use(requireAuth);
router.get('/', shortcutsController.list);
router.post('/', shortcutsController.create);
router.put('/:id', shortcutsController.update);
router.delete('/:id', shortcutsController.remove);

export const shortcutsRoutes = router;
