import { pool } from '../config/db.js';

export async function listar(req, res, next) {
  try {
    const { categoria, tipo_contenido } = req.query;
    const params = [];
    let sql = 'SELECT * FROM capacitaciones WHERE publicado = TRUE';
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    if (tipo_contenido) { sql += ' AND tipo_contenido = ?'; params.push(tipo_contenido); }
    sql += ' ORDER BY fecha_publicacion DESC';

    const [filas] = await pool.query(sql, params);
    res.json(filas);
  } catch (error) {
    next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const [filas] = await pool.query('SELECT * FROM capacitaciones WHERE id = ?', [req.params.id]);
    if (!filas.length) return res.status(404).json({ mensaje: 'Capacitación no encontrada' });
    res.json(filas[0]);
  } catch (error) {
    next(error);
  }
}

/** Progreso del usuario autenticado */
export async function miProgreso(req, res, next) {
  try {
    const [filas] = await pool.query(
      `SELECT c.id, c.titulo, c.tipo_contenido, c.duracion_minutos,
              COALESCE(p.porcentaje_avance, 0) AS porcentaje_avance,
              COALESCE(p.completado, FALSE)    AS completado
       FROM capacitaciones c
       LEFT JOIN capacitacion_progreso p ON p.capacitacion_id = c.id AND p.usuario_id = ?
       WHERE c.publicado = TRUE
       ORDER BY c.fecha_publicacion DESC`,
      [req.usuario.id]
    );
    res.json(filas);
  } catch (error) {
    next(error);
  }
}

/** Crea o actualiza el progreso (UPSERT sobre la restricción única) */
export async function guardarProgreso(req, res, next) {
  try {
    const { porcentaje_avance = 0 } = req.body;
    const completado = Number(porcentaje_avance) >= 100;

    await pool.query(
      `INSERT INTO capacitacion_progreso
        (usuario_id, capacitacion_id, completado, porcentaje_avance, fecha_completado)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         porcentaje_avance = VALUES(porcentaje_avance),
         completado        = VALUES(completado),
         fecha_completado  = VALUES(fecha_completado)`,
      [req.usuario.id, req.params.id, completado, porcentaje_avance, completado ? new Date() : null]
    );

    res.json({ mensaje: 'Progreso guardado', completado });
  } catch (error) {
    next(error);
  }
}
