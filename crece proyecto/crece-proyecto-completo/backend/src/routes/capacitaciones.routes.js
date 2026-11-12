import { Router } from 'express';
import * as ctrl from '../controllers/capacitaciones.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', ctrl.listar);
router.get('/mi-progreso', verificarToken, ctrl.miProgreso);
router.get('/:id', ctrl.obtener);
router.post('/:id/progreso', verificarToken, ctrl.guardarProgreso);

export default router;
