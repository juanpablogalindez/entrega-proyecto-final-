import { pool } from '../config/db.js';

export async function listarPorNegocio(req, res, next) {
  try {
    const [filas] = await pool.query(
      `SELECT r.id, r.negocio_id, r.usuario_id, r.calificacion, r.comentario, r.respuesta_negocio, r.fecha_creacion,
              u.nombre_completo AS usuario_nombre
       FROM resenas r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.negocio_id = ?
       ORDER BY r.fecha_creacion DESC`,
      [req.params.negocioId]
    );
    res.json(filas);
  } catch (error) {
    next(error);
  }
}

/** Un usuario solo puede dejar una reseña por negocio (restricción única en BD) */
export async function crear(req, res, next) {
  try {
    const { negocio_id, calificacion, comentario } = req.body;

    const [existe] = await pool.query(
      'SELECT id FROM resenas WHERE negocio_id = ? AND usuario_id = ?',
      [negocio_id, req.usuario.id]
    );
    if (existe.length) {
      return res.status(409).json({ mensaje: 'Ya calificó este negocio. Puede editar su reseña.' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO resenas (negocio_id, usuario_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
      [negocio_id, req.usuario.id, calificacion, comentario || null]
    );
    res.status(201).json({ id: resultado.insertId, mensaje: 'Reseña publicada' });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req, res, next) {
  try {
    const { calificacion, comentario } = req.body;
    const [filas] = await pool.query('SELECT usuario_id FROM resenas WHERE id = ?', [req.params.id]);
    if (!filas.length) return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    if (filas[0].usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'No puede editar esta reseña' });
    }

    await pool.query(
      'UPDATE resenas SET calificacion = COALESCE(?, calificacion), comentario = ? WHERE id = ?',
      [calificacion, comentario || null, req.params.id]
    );
    res.json({ mensaje: 'Reseña actualizada' });
  } catch (error) {
    next(error);
  }
}

/** El dueño del negocio responde una reseña */
export async function responder(req, res, next) {
  try {
    const { respuesta_negocio } = req.body;
    const [filas] = await pool.query(
      `SELECT n.usuario_id FROM resenas r JOIN negocios n ON n.id = r.negocio_id WHERE r.id = ?`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    if (filas[0].usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'No puede responder esta reseña' });
    }

    await pool.query('UPDATE resenas SET respuesta_negocio = ? WHERE id = ?',
      [respuesta_negocio, req.params.id]);
    res.json({ mensaje: 'Respuesta publicada' });
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req, res, next) {
  try {
    const [filas] = await pool.query('SELECT usuario_id FROM resenas WHERE id = ?', [req.params.id]);
    if (!filas.length) return res.status(404).json({ mensaje: 'Reseña no encontrada' });
    if (filas[0].usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'No puede eliminar esta reseña' });
    }
    await pool.query('DELETE FROM resenas WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Reseña eliminada' });
  } catch (error) {
    next(error);
  }
}
