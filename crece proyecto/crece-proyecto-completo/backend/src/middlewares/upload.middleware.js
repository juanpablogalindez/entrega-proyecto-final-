import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaUploads = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(rutaUploads)) {
  fs.mkdirSync(rutaUploads, { recursive: true });
}

const almacenamiento = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, rutaUploads),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || '.jpg';
    const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, nombre);
  }
});

export const upload = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitidas = [
      'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
      'application/pdf'
    ];
    if (permitidas.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Formato de imagen no permitido'));
  }
});
