import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/resenas.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { validarCampos } from '../middlewares/validar.middleware.js';

const router = Router();

router.get('/negocio/:negocioId', ctrl.listarPorNegocio);

router.post(
  '/',
  verificarToken,
  [
    body('negocio_id').isInt(),
    body('calificacion').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ir de 1 a 5'),
    validarCampos
  ],
  ctrl.crear
);

router.put('/:id', verificarToken, ctrl.actualizar);
router.patch('/:id/responder', verificarToken, ctrl.responder);
router.delete('/:id', verificarToken, ctrl.eliminar);

export default router;
