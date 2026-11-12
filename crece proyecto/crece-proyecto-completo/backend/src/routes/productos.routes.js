import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/productos.controller.js';
import { verificarToken, permitirRoles } from '../middlewares/auth.middleware.js';
import { validarCampos } from '../middlewares/validar.middleware.js';

const router = Router();

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);

router.post(
  '/',
  verificarToken,
  permitirRoles('negocio', 'admin'),
  [
    body('negocio_id').isInt().withMessage('negocio_id es obligatorio'),
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('precio').optional().isFloat({ min: 0 }).withMessage('El precio no puede ser negativo'),
    validarCampos
  ],
  ctrl.crear
);

router.put('/:id', verificarToken, ctrl.actualizar);
router.delete('/:id', verificarToken, ctrl.eliminar);

export default router;
