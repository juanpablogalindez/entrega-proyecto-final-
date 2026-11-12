import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/pedidos.controller.js';
import { verificarToken, permitirRoles } from '../middlewares/auth.middleware.js';
import { validarCampos } from '../middlewares/validar.middleware.js';

const router = Router();

router.use(verificarToken);
router.get('/', ctrl.listar);
router.post(
  '/',
  permitirRoles('cliente'),
  [
    body('negocio_id').isInt({ min: 1 }).withMessage('negocio_id es obligatorio'),
    body('metodo_pago').isIn(['efectivo', 'transferencia', 'tarjeta', 'otro'])
      .withMessage('Forma de pago inválida'),
    body('observaciones').optional().isString().isLength({ max: 1000 }),
    body('items').isArray({ min: 1, max: 20 }).withMessage('El pedido debe tener entre 1 y 20 ítems'),
    body('items.*.producto_id').isInt({ min: 1 }).withMessage('Producto inválido'),
    body('items.*.cantidad').isInt({ min: 1, max: 99 }).withMessage('La cantidad debe estar entre 1 y 99'),
    validarCampos
  ],
  ctrl.crear
);
router.patch(
  '/:id/estado',
  permitirRoles('negocio', 'admin'),
  [body('estado').isIn(['confirmado', 'preparando', 'listo', 'entregado', 'cancelado']), validarCampos],
  ctrl.cambiarEstado
);

export default router;
