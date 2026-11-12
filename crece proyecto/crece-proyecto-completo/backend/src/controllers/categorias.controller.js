import { pool } from '../config/db.js';

export async function listar(_req, res, next) {
  try {
    const [filas] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(filas);
  } catch (error) {
    next(error);
  }
}
