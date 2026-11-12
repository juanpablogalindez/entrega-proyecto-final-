import { pool } from '../config/db.js';

function normalizarImagen(url, req) {
  if (!url) return url;
  const base = `${req.protocol}://${req.get('host')}`;
  if (url.startsWith('/uploads/')) return `${base}${url}`;
  if (url.includes('/uploads/')) return `${base}${new URL(url).pathname}`;
  return url.replace(/^https?:\/\/localhost(?::\d+)?/, base);
}

async function esPropietarioNegocio(negocioId, usuario) {
  if (usuario.rol === 'admin') return true;
  const [filas] = await pool.query('SELECT usuario_id FROM negocios WHERE id = ?', [negocioId]);
  return filas.length > 0 && filas[0].usuario_id === usuario.id;
}

/** Catálogo de un negocio: /api/productos?negocio_id=1&tipo=producto&q=arepa */
export async function listar(req, res, next) {
  try {
    const { negocio_id, tipo, q, solo_disponibles = 'true' } = req.query;
    const params = [];
    let sql = `SELECT p.*, c.nombre AS categoria_nombre
               FROM productos_servicios p
               LEFT JOIN categorias c ON c.id = p.categoria_id
               WHERE 1 = 1`;

    if (negocio_id) { sql += ' AND p.negocio_id = ?'; params.push(Number(negocio_id)); }
    if (tipo) { sql += ' AND p.tipo = ?'; params.push(tipo); }
    if (q) { sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (solo_disponibles === 'true') sql += ' AND p.disponible = TRUE';

    sql += ' ORDER BY p.fecha_creacion DESC';

    const [filas] = await pool.query(sql, params);
    res.json(filas.map((fila) => ({
      ...fila,
      imagen_url: normalizarImagen(fila.imagen_url, req)
    })));
  } catch (error) {
    next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const [filas] = await pool.query('SELECT * FROM productos_servicios WHERE id = ?', [req.params.id]);
    if (!filas.length) return res.status(404).json({ mensaje: 'Producto o servicio no encontrado' });
    res.json({ ...filas[0], imagen_url: normalizarImagen(filas[0].imagen_url, req) });
  } catch (error) {
    next(error);
  }
}

export async function crear(req, res, next) {
  try {
    const { negocio_id, categoria_id, nombre, descripcion, precio = 0,
            tipo = 'producto', imagen_url, disponible = true } = req.body;

    if (!(await esPropietarioNegocio(negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede agregar ítems a este negocio' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO productos_servicios
        (negocio_id, categoria_id, nombre, descripcion, precio, tipo, imagen_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [negocio_id, categoria_id || null, nombre, descripcion || null, precio, tipo,
       imagen_url || null, !!disponible]
    );

    res.status(201).json({ id: resultado.insertId, mensaje: 'Ítem agregado al catálogo' });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req, res, next) {
  try {
    const [existente] = await pool.query('SELECT negocio_id FROM productos_servicios WHERE id = ?', [req.params.id]);
    if (!existente.length) return res.status(404).json({ mensaje: 'Ítem no encontrado' });
    if (!(await esPropietarioNegocio(existente[0].negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede modificar este ítem' });
    }

    const campos = ['categoria_id', 'nombre', 'descripcion', 'precio', 'tipo', 'imagen_url', 'disponible'];
    const set = [];
    const valores = [];
    for (const campo of campos) {
      if (req.body[campo] !== undefined) { set.push(`${campo} = ?`); valores.push(req.body[campo]); }
    }
    if (!set.length) return res.status(400).json({ mensaje: 'No hay cambios para aplicar' });

    valores.push(req.params.id);
    await pool.query(`UPDATE productos_servicios SET ${set.join(', ')} WHERE id = ?`, valores);
    res.json({ mensaje: 'Ítem actualizado' });
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req, res, next) {
  try {
    const [existente] = await pool.query('SELECT negocio_id FROM productos_servicios WHERE id = ?', [req.params.id]);
    if (!existente.length) return res.status(404).json({ mensaje: 'Ítem no encontrado' });
    if (!(await esPropietarioNegocio(existente[0].negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede eliminar este ítem' });
    }
    await pool.query('DELETE FROM productos_servicios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Ítem eliminado' });
  } catch (error) {
    next(error);
  }
}
