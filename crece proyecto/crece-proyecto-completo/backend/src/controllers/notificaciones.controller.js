import { pool } from '../config/db.js';

export async function listar(req, res, next) {
  try {
    let filas;

    if (req.usuario.rol === 'negocio' || req.usuario.rol === 'admin') {
      [filas] = await pool.query(
        `SELECT CONCAT('resena-', r.id) AS id,
                'reseña' AS tipo,
                CONCAT('Nueva reseña en ', n.nombre_negocio) AS titulo,
                CONCAT(COALESCE(u.nombre_completo, 'Un cliente'), ' dejó ', r.calificacion, ' estrellas') AS mensaje,
                r.fecha_creacion AS fecha,
                CONCAT('/negocio/', n.id) AS ruta
         FROM resenas r
         JOIN negocios n ON n.id = r.negocio_id
         JOIN usuarios u ON u.id = r.usuario_id
         WHERE (? = 'admin' OR n.usuario_id = ?)
         ORDER BY r.fecha_creacion DESC
         LIMIT 20`,
        [req.usuario.rol, req.usuario.id]
      );

      const [pagos] = await pool.query(
        `SELECT CONCAT('pago-factura-', f.id) AS id,
                'pago-factura' AS tipo,
                CONCAT('Factura ', f.numero_factura, ' pagada') AS titulo,
                CONCAT(COALESCE(f.cliente_nombre, 'El cliente'), ' pagó $', FORMAT(f.total, 2)) AS mensaje,
                f.fecha_emision AS fecha,
                CONCAT('/factura/', f.id) AS ruta
         FROM facturas f
         JOIN negocios n ON n.id = f.negocio_id
         WHERE f.estado = 'pagada'
           AND (? = 'admin' OR n.usuario_id = ?)
         ORDER BY f.fecha_emision DESC
         LIMIT 20`,
        [req.usuario.rol, req.usuario.id]
      );

      const [pedidos] = await pool.query(
        `SELECT CONCAT('pedido-', p.id) AS id,
                'pedido' AS tipo,
                CONCAT('Nuevo pedido #', p.id, ' en ', n.nombre_negocio) AS titulo,
                CONCAT(COALESCE(u.nombre_completo, 'Un cliente'), ' realizó un pedido por $',
                       FORMAT(p.total, 0), ' · pago: ',
                       CASE p.metodo_pago
                         WHEN 'efectivo' THEN 'Efectivo'
                         WHEN 'transferencia' THEN 'Transferencia'
                         WHEN 'tarjeta' THEN 'Tarjeta'
                         ELSE 'Otro'
                       END) AS mensaje,
                p.fecha_creacion AS fecha,
                '/tabs/mi-negocio' AS ruta
         FROM pedidos p
         JOIN negocios n ON n.id = p.negocio_id
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE (? = 'admin' OR n.usuario_id = ?)
         ORDER BY p.fecha_creacion DESC
         LIMIT 20`,
        [req.usuario.rol, req.usuario.id]
      );

      const [notificacionesPersistentes] = await pool.query(
        `SELECT CONCAT('notificacion-', id) AS id, tipo, titulo, mensaje,
                fecha_creacion AS fecha, ruta
         FROM notificaciones
         WHERE usuario_id = ?
         ORDER BY fecha_creacion DESC
         LIMIT 20`,
        [req.usuario.id]
      );

      filas = [...filas, ...pagos, ...pedidos, ...notificacionesPersistentes]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 20);
    } else {
      const [negocios] = await pool.query(
        `SELECT CONCAT('negocio-', n.id) AS id,
                'negocio' AS tipo,
                'Nuevo negocio en Crece+' AS titulo,
                n.nombre_negocio AS mensaje,
                n.fecha_creacion AS fecha,
                CONCAT('/negocio/', n.id) AS ruta
         FROM negocios n
         WHERE n.estado = 'activo'
         ORDER BY n.fecha_creacion DESC
         LIMIT 20`
      );

      const [respuestas] = await pool.query(
        `SELECT CONCAT('respuesta-', r.id, '-', MD5(COALESCE(r.respuesta_negocio, ''))) AS id,
                'respuesta' AS tipo,
                CONCAT('El negocio respondió tu reseña') AS titulo,
                CONCAT(n.nombre_negocio, ': ', r.respuesta_negocio) AS mensaje,
                r.fecha_creacion AS fecha,
                CONCAT('/negocio/', n.id) AS ruta
         FROM resenas r
         JOIN negocios n ON n.id = r.negocio_id
         WHERE r.usuario_id = ? AND r.respuesta_negocio IS NOT NULL
         ORDER BY r.fecha_creacion DESC
         LIMIT 20`,
        [req.usuario.id]
      );

      const [facturas] = await pool.query(
        `SELECT CONCAT('factura-', f.id) AS id,
                'factura' AS tipo,
                CONCAT('Factura ', f.numero_factura, ' recibida') AS titulo,
                CONCAT(n.nombre_negocio, ' emitió una factura por $', FORMAT(f.total, 2)) AS mensaje,
                f.fecha_emision AS fecha,
                CONCAT('/factura/', f.id) AS ruta
         FROM facturas f
         JOIN negocios n ON n.id = f.negocio_id
         JOIN usuarios u ON LOWER(TRIM(u.email)) = LOWER(TRIM(f.cliente_email))
         WHERE u.id = ?
         ORDER BY f.fecha_emision DESC
         LIMIT 20`,
        [req.usuario.id]
      );

      const [notificacionesPedidos] = await pool.query(
        `SELECT CONCAT('pedido-', np.tipo, '-', np.id) AS id,
                CASE np.tipo
                  WHEN 'confirmado' THEN 'pedido-confirmado'
                  ELSE 'pedido-entregado'
                END AS tipo,
                CASE np.tipo
                  WHEN 'confirmado' THEN CONCAT('Pedido #', p.id, ' aprobado')
                  ELSE CONCAT('Pedido #', p.id, ' entregado')
                END AS titulo,
                CASE np.tipo
                  WHEN 'confirmado' THEN CONCAT(n.nombre_negocio, ' aprobó tu pedido por $', FORMAT(p.total, 0),
                    ' · pago: ',
                    CASE p.metodo_pago
                      WHEN 'efectivo' THEN 'Efectivo'
                      WHEN 'transferencia' THEN 'Transferencia'
                      WHEN 'tarjeta' THEN 'Tarjeta'
                      ELSE 'Otro'
                    END)
                  ELSE CONCAT(n.nombre_negocio, ' marcó tu pedido por $', FORMAT(p.total, 0), ' como entregado')
                END AS mensaje,
                np.fecha_creacion AS fecha,
                CONCAT('/negocio/', n.id) AS ruta
         FROM notificaciones_pedidos np
         JOIN pedidos p ON p.id = np.pedido_id
         JOIN negocios n ON n.id = p.negocio_id
         WHERE np.usuario_id = ? AND np.tipo IN ('confirmado', 'entregado')
         ORDER BY np.fecha_creacion DESC
         LIMIT 20`,
        [req.usuario.id]
      );

      filas = [...negocios, ...respuestas, ...facturas, ...notificacionesPedidos]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 20);
    }

    res.json(filas);
  } catch (error) {
    next(error);
  }
}
