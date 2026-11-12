import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/facturas.controller.js';
import { verificarToken, permitirRoles } from '../middlewares/auth.middleware.js';
import { validarCampos } from '../middlewares/validar.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', ctrl.listar);
router.get('/:id/pdf', ctrl.descargarPdf);
router.get('/:id', ctrl.obtener);
router.patch('/:id/pagar', ctrl.pagarComoCliente);

router.post(
  '/',
  permitirRoles('negocio', 'admin'),
  [
    body('negocio_id').isInt().withMessage('negocio_id es obligatorio'),
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un ítem'),
    validarCampos
  ],
  ctrl.crear
);

router.patch('/:id/estado', ctrl.cambiarEstado);

export default router;
