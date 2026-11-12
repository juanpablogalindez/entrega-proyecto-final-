import { Router } from 'express';
import * as ctrl from '../controllers/favoritos.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verificarToken);

router.get('/', ctrl.listar);
router.post('/', ctrl.agregar);
router.delete('/:negocioId', ctrl.eliminar);

export default router;
