import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import categoriaRoutes from './routes/categorias.routes.js';
import negocioRoutes from './routes/negocios.routes.js';
import productoRoutes from './routes/productos.routes.js';
import facturaRoutes from './routes/facturas.routes.js';
import pedidoRoutes from './routes/pedidos.routes.js';
import capacitacionRoutes from './routes/capacitaciones.routes.js';
import resenaRoutes from './routes/resenas.routes.js';
import favoritoRoutes from './routes/favoritos.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { manejadorErrores, noEncontrado } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const uploadsDir = path.join(__dirname, '..', 'uploads');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => res.json({ ok: true, proyecto: 'Crece+ V1.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/negocios', negocioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/capacitaciones', capacitacionRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/upload', uploadRoutes);

app.use(noEncontrado);
app.use(manejadorErrores);

export default app;
