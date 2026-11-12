import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/negocios.controller.js';
import { verificarToken, permitirRoles } from '../middlewares/auth.middleware.js';
import { validarCampos } from '../middlewares/validar.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', ctrl.listar);
router.get('/mis-negocios', verificarToken, ctrl.miNegocio);
router.get('/admin/pendientes-verificacion', verificarToken, permitirRoles('admin'), ctrl.listarPendientesVerificacion);
router.get('/:id/verificacion', verificarToken, permitirRoles('admin'), ctrl.obtenerVerificacion);
router.get('/:id/verificacion/historial', verificarToken, permitirRoles('admin'), ctrl.historialVerificacion);
router.patch('/:id/verificacion/reabrir', verificarToken, permitirRoles('admin'), ctrl.reabrirVerificacion);
router.post('/:id/verificacion/revisar', verificarToken, permitirRoles('admin'), ctrl.revisarVerificacion);
router.post('/:id/verificacion/reenviar', verificarToken, permitirRoles('negocio'), ctrl.reenviarVerificacion);
router.post('/:id/documentos/:tipo', verificarToken, permitirRoles('negocio', 'admin'), upload.single('file'), ctrl.subirDocumentoNegocio);
router.post('/:id/documento-legalidad/generar', verificarToken, permitirRoles('negocio', 'admin'), ctrl.generarDeclaracionLegalidad);
router.get('/:id', ctrl.obtener);

router.post(
  '/',
  verificarToken,
  permitirRoles('negocio', 'admin'),
  [body('nombre_negocio').trim().notEmpty().withMessage('El nombre del negocio es obligatorio'), validarCampos],
  ctrl.crear
);

router.put('/:id', verificarToken, ctrl.actualizar);
router.delete('/:id', verificarToken, ctrl.eliminar);

export default router;
