import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensaje: 'No se recibió ninguna imagen' });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.status(200).json({ url });
});

export default router;
