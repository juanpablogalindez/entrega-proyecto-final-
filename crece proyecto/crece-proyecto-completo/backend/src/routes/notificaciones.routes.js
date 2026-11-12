import { Router } from 'express';
import * as ctrl from '../controllers/notificaciones.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verificarToken, ctrl.listar);

export default router;
