import { Router } from 'express';
import { listar } from '../controllers/categorias.controller.js';

const router = Router();
router.get('/', listar);
export default router;
