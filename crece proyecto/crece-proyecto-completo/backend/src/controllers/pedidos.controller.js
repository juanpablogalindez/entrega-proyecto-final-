import { pool } from '../config/db.js';

async function esPropietarioNegocio(negocioId, usuario) {
  if (usuario.rol === 'admin') return true;
  const [filas] = await pool.query('SELECT usuario_id FROM negocios WHERE id = ?', [negocioId]);
  return filas.length > 0 && filas[0].usuario_id === usuario.id;
}

async function incluirDetalle(pedidos) {
  if (!pedidos.length) return [];
  const ids = pedidos.map((pedido) => pedido.id);
  const [detalle] = await pool.query(
    `SELECT pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal_linea
     FROM pedido_detalle WHERE pedido_id IN (?) ORDER BY id ASC`,
    [ids]
  );
  const porPedido = new Map(pedidos.map((pedido) => [pedido.id, []]));
  for (const item of detalle) porPedido.get(item.pedido_id)?.push(item);
  return pedidos.map((pedido) => ({ ...pedido, items: porPedido.get(pedido.id) || [] }));
}

export async function listar(req, res, next) {
  try {
    if (req.usuario.rol === 'cliente') {
      const [pedidos] = await pool.query(
        `SELECT p.*, n.nombre_negocio
         FROM pedidos p
         JOIN negocios n ON n.id = p.negocio_id
         WHERE p.usuario_id = ?
         ORDER BY p.fecha_creacion DESC`,
        [req.usuario.id]
      );
      return res.json(await incluirDetalle(pedidos));
    }

    const { negocio_id } = req.query;
    if (!negocio_id) return res.status(400).json({ mensaje: 'negocio_id es obligatorio' });
    if (!(await esPropietarioNegocio(negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede ver los pedidos de este negocio' });
    }

    const [pedidos] = await pool.query(
      `SELECT p.*, u.nombre_completo AS cliente_nombre, u.telefono AS cliente_telefono
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.negocio_id = ?
       ORDER BY p.fecha_creacion DESC`,
      [Number(negocio_id)]
    );
    res.json(await incluirDetalle(pedidos));
  } catch (error) {
    next(error);
  }
}

export async function crear(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { negocio_id, metodo_pago, observaciones = '', items = [] } = req.body;
    const cantidades = new Map();
    for (const item of items) {
      cantidades.set(item.producto_id, (cantidades.get(item.producto_id) || 0) + item.cantidad);
    }
    if ([...cantidades.values()].some((cantidad) => cantidad > 99)) {
      return res.status(400).json({ mensaje: 'La cantidad máxima por ítem es 99' });
    }

    await conn.beginTransaction();
    const [negocios] = await conn.query(
      'SELECT estado FROM negocios WHERE id = ? FOR UPDATE',
      [negocio_id]
    );
    if (!negocios.length) {
      await conn.rollback();
      return res.status(404).json({ mensaje: 'Negocio no encontrado' });
    }
    if (negocios[0].estado !== 'activo') {
      await conn.rollback();
      return res.status(400).json({ mensaje: 'Este negocio no está recibiendo pedidos' });
    }

    const [productos] = await conn.query(
      `SELECT id, nombre, precio, disponible
       FROM productos_servicios
       WHERE negocio_id = ? AND id IN (?) FOR UPDATE`,
      [negocio_id, [...cantidades.keys()]]
    );
    if (productos.length !== cantidades.size) {
      await conn.rollback();
      return res.status(400).json({ mensaje: 'Uno o más productos no pertenecen a este negocio' });
    }
    const noDisponibles = productos.filter((producto) => !producto.disponible);
    if (noDisponibles.length) {
      await conn.rollback();
      return res.status(400).json({ mensaje: 'Uno o más productos ya no están disponibles' });
    }

    const detalle = productos.map((producto) => {
      const cantidad = cantidades.get(producto.id);
      const precio = Number(producto.precio);
      return {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad,
        precio,
        subtotal: Number((precio * cantidad).toFixed(2))
      };
    });
    const total = Number(detalle.reduce((suma, item) => suma + item.subtotal, 0).toFixed(2));

    const [resultado] = await conn.query(
      `INSERT INTO pedidos (negocio_id, usuario_id, total, metodo_pago, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [negocio_id, req.usuario.id, total, metodo_pago, observaciones.trim() || null]
    );
    for (const item of detalle) {
      await conn.query(
        `INSERT INTO pedido_detalle
          (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal_linea)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [resultado.insertId, item.producto_id, item.nombre, item.cantidad, item.precio, item.subtotal]
      );
    }

    await conn.commit();
    res.status(201).json({
      id: resultado.insertId,
      total,
      mensaje: 'Pedido enviado al negocio'
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

export async function cambiarEstado(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { estado } = req.body;
    const transiciones = {
      pendiente: ['confirmado', 'cancelado'],
      confirmado: ['preparando', 'cancelado'],
      preparando: ['listo', 'cancelado'],
      listo: ['entregado'],
      entregado: [],
      cancelado: []
    };
    await conn.beginTransaction();
    const [filas] = await conn.query(
      'SELECT id, negocio_id, usuario_id, estado FROM pedidos WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!filas.length) {
      await conn.rollback();
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    if (!(await esPropietarioNegocio(filas[0].negocio_id, req.usuario))) {
      await conn.rollback();
      return res.status(403).json({ mensaje: 'No puede modificar este pedido' });
    }
    if (!transiciones[filas[0].estado]?.includes(estado)) {
      await conn.rollback();
      return res.status(400).json({ mensaje: 'Cambio de estado no permitido' });
    }

    await conn.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);
    if (estado === 'confirmado' || estado === 'entregado') {
      await conn.query(
        `INSERT INTO notificaciones_pedidos (pedido_id, usuario_id, tipo)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [filas[0].id, filas[0].usuario_id, estado]
      );
    }
    await conn.commit();
    res.json({ mensaje: `Pedido marcado como ${estado}` });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}
