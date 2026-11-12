import { pool } from '../config/db.js';

export async function listar(req, res, next) {
  try {
    const [filas] = await pool.query(
      `SELECT f.id AS favorito_id, f.fecha_guardado, n.*
       FROM favoritos f
       JOIN negocios n ON n.id = f.negocio_id
       WHERE f.usuario_id = ?
       ORDER BY f.fecha_guardado DESC`,
      [req.usuario.id]
    );
    res.json(filas);
  } catch (error) {
    next(error);
  }
}

export async function agregar(req, res, next) {
  try {
    const { negocio_id } = req.body;
    await pool.query(
      'INSERT IGNORE INTO favoritos (usuario_id, negocio_id) VALUES (?, ?)',
      [req.usuario.id, negocio_id]
    );
    res.status(201).json({ mensaje: 'Negocio guardado en favoritos' });
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req, res, next) {
  try {
    await pool.query('DELETE FROM favoritos WHERE usuario_id = ? AND negocio_id = ?',
      [req.usuario.id, req.params.negocioId]);
    res.json({ mensaje: 'Negocio retirado de favoritos' });
  } catch (error) {
    next(error);
  }
}
