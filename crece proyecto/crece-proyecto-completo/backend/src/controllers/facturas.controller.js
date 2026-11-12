import PDFDocument from 'pdfkit';
import { pool } from '../config/db.js';

async function esPropietarioNegocio(negocioId, usuario) {
  if (usuario.rol === 'admin') return true;
  const [filas] = await pool.query('SELECT usuario_id FROM negocios WHERE id = ?', [negocioId]);
  return filas.length > 0 && filas[0].usuario_id === usuario.id;
}

/** Genera el consecutivo FAC-000001 por negocio */
async function siguienteConsecutivo(conn, negocioId) {
  const [filas] = await conn.query(
    'SELECT COUNT(*) AS total FROM facturas WHERE negocio_id = ?',
    [negocioId]
  );
  const siguiente = Number(filas[0].total) + 1;
  return `FAC-${String(siguiente).padStart(6, '0')}`;
}

export async function listar(req, res, next) {
  try {
    const { negocio_id, estado, desde, hasta } = req.query;
    if (!negocio_id) return res.status(400).json({ mensaje: 'negocio_id es obligatorio' });
    if (!(await esPropietarioNegocio(negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede ver las facturas de este negocio' });
    }

    const params = [Number(negocio_id)];
    let sql = 'SELECT * FROM facturas WHERE negocio_id = ?';
    if (estado) { sql += ' AND estado = ?'; params.push(estado); }
    if (desde) { sql += ' AND fecha_emision >= ?'; params.push(desde); }
    if (hasta) { sql += ' AND fecha_emision <= ?'; params.push(hasta); }
    sql += ' ORDER BY fecha_emision DESC';

    const [filas] = await pool.query(sql, params);
    res.json(filas);
  } catch (error) {
    next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const [facturas] = await pool.query('SELECT * FROM facturas WHERE id = ?', [req.params.id]);
    if (!facturas.length) return res.status(404).json({ mensaje: 'Factura no encontrada' });

    const esPropietario = await esPropietarioNegocio(facturas[0].negocio_id, req.usuario);
    const esCliente = req.usuario.rol === 'cliente'
      && facturas[0].cliente_email
      && facturas[0].cliente_email.trim().toLowerCase() === req.usuario.email.trim().toLowerCase();
    if (!esPropietario && !esCliente) {
      return res.status(403).json({ mensaje: 'No puede ver esta factura' });
    }

    const [detalle] = await pool.query(
      'SELECT * FROM factura_detalle WHERE factura_id = ?',
      [req.params.id]
    );
    res.json({ ...facturas[0], detalle });
  } catch (error) {
    next(error);
  }
}

/**
 * Crea una factura con sus líneas dentro de una transacción.
 * Body: { negocio_id, cliente_nombre, cliente_documento, cliente_email,
 *         metodo_pago, porcentaje_impuesto, items: [{producto_id, descripcion_item, cantidad, precio_unitario}] }
 */
export async function crear(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const {
      negocio_id, cliente_nombre, cliente_documento, cliente_email,
      metodo_pago = 'efectivo', porcentaje_impuesto = 0, observaciones, items = []
    } = req.body;
    const emailCliente = cliente_email?.trim().toLowerCase() || null;

    if (!(await esPropietarioNegocio(negocio_id, req.usuario))) {
      conn.release();
      return res.status(403).json({ mensaje: 'No puede facturar por este negocio' });
    }
    if (!items.length) {
      conn.release();
      return res.status(400).json({ mensaje: 'La factura debe tener al menos un ítem' });
    }

    await conn.beginTransaction();

    const [clientes] = emailCliente
      ? await conn.query(
          `SELECT id FROM usuarios
           WHERE LOWER(TRIM(email)) = ? AND rol = 'cliente'
           LIMIT 1`,
          [emailCliente]
        )
      : [[]];

    const subtotal = items.reduce(
      (acumulado, item) => acumulado + Number(item.cantidad) * Number(item.precio_unitario),
      0
    );
    const impuestos = +(subtotal * (Number(porcentaje_impuesto) / 100)).toFixed(2);
    const total = +(subtotal + impuestos).toFixed(2);
    const numero_factura = await siguienteConsecutivo(conn, negocio_id);

    const [resultado] = await conn.query(
      `INSERT INTO facturas
        (negocio_id, numero_factura, cliente_nombre, cliente_documento, cliente_email,
         subtotal, impuestos, total, metodo_pago, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [negocio_id, numero_factura, cliente_nombre || null, cliente_documento || null,
       emailCliente, subtotal, impuestos, total, metodo_pago, observaciones || null]
    );

    const facturaId = resultado.insertId;

    for (const item of items) {
      const subtotal_linea = +(Number(item.cantidad) * Number(item.precio_unitario)).toFixed(2);
      await conn.query(
        `INSERT INTO factura_detalle
          (factura_id, producto_id, descripcion_item, cantidad, precio_unitario, subtotal_linea)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [facturaId, item.producto_id || null, item.descripcion_item,
         item.cantidad, item.precio_unitario, subtotal_linea]
      );
    }

    await conn.commit();
    res.status(201).json({
      id: facturaId,
      numero_factura,
      subtotal,
      impuestos,
      total,
      cliente_notificado: clientes.length > 0
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const { estado } = req.body;
    if (!['pendiente', 'pagada', 'anulada'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido' });
    }

    const [facturas] = await pool.query('SELECT negocio_id FROM facturas WHERE id = ?', [req.params.id]);
    if (!facturas.length) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    if (!(await esPropietarioNegocio(facturas[0].negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede modificar esta factura' });
    }

    await pool.query('UPDATE facturas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ mensaje: `Factura marcada como ${estado}` });
  } catch (error) {
    next(error);
  }
}

export async function pagarComoCliente(req, res, next) {
  try {
    const [facturas] = await pool.query(
      'SELECT id, estado, cliente_email FROM facturas WHERE id = ?',
      [req.params.id]
    );
    if (!facturas.length) return res.status(404).json({ mensaje: 'Factura no encontrada' });

    const factura = facturas[0];
    const esCliente = req.usuario.rol === 'cliente'
      && factura.cliente_email
      && factura.cliente_email.trim().toLowerCase() === req.usuario.email.trim().toLowerCase();
    if (!esCliente) return res.status(403).json({ mensaje: 'No puede pagar esta factura' });
    if (factura.estado === 'pagada') return res.json({ mensaje: 'La factura ya está pagada' });
    if (factura.estado === 'anulada') return res.status(400).json({ mensaje: 'No se puede pagar una factura anulada' });

    await pool.query('UPDATE facturas SET estado = ? WHERE id = ?', ['pagada', req.params.id]);
    res.json({ mensaje: 'Pago registrado correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function descargarPdf(req, res, next) {
  try {
    const [facturas] = await pool.query('SELECT * FROM facturas WHERE id = ?', [req.params.id]);
    if (!facturas.length) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    if (!(await esPropietarioNegocio(facturas[0].negocio_id, req.usuario))) {
      return res.status(403).json({ mensaje: 'No puede descargar esta factura' });
    }

    const [detalle] = await pool.query(
      'SELECT * FROM factura_detalle WHERE factura_id = ? ORDER BY id ASC',
      [req.params.id]
    );

    const [negocioRows] = await pool.query(
      `SELECT n.*, c.nombre AS categoria_nombre
       FROM negocios n
       LEFT JOIN categorias c ON c.id = n.categoria_id
       WHERE n.id = ?`,
      [facturas[0].negocio_id]
    );

    const negocio = negocioRows[0] || {};
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${facturas[0].numero_factura}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text(negocio.nombre_negocio || 'Negocio Crece+');
    doc.fontSize(10).font('Helvetica').text(negocio.direccion || 'Dirección no registrada');
    doc.text(negocio.telefono_negocio || 'Sin teléfono');
    doc.text(`Email: ${negocio.email_negocio || 'No disponible'}`);
    doc.moveDown();

    doc.fontSize(16).font('Helvetica-Bold').text('Factura');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Número: ${facturas[0].numero_factura}`);
    doc.text(`Fecha: ${new Date(facturas[0].fecha_emision).toLocaleString('es-CO')}`);
    doc.text(`Cliente: ${facturas[0].cliente_nombre || 'Consumidor final'}`);
    doc.text(`Documento: ${facturas[0].cliente_documento || 'N/A'}`);
    doc.text(`Correo: ${facturas[0].cliente_email || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Detalle', { underline: true });
    doc.moveDown(0.2);

    const inicioX = 40;
    let y = doc.y;
    doc.font('Helvetica-Bold').text('Descripción', inicioX, y, { width: 220, align: 'left' });
    doc.text('Cant.', 280, y, { width: 40, align: 'right' });
    doc.text('Precio', 330, y, { width: 70, align: 'right' });
    doc.text('Subtotal', 420, y, { width: 90, align: 'right' });
    y += 18;

    doc.moveTo(40, y).lineTo(550, y).stroke();
    y += 8;

    doc.font('Helvetica');
    for (const item of detalle) {
      const linea = `${item.descripcion_item}`;
      doc.text(linea, inicioX, y, { width: 220, align: 'left' });
      doc.text(String(item.cantidad), 280, y, { width: 40, align: 'right' });
      doc.text(Number(item.precio_unitario).toFixed(2), 330, y, { width: 70, align: 'right' });
      doc.text(Number(item.subtotal_linea).toFixed(2), 420, y, { width: 90, align: 'right' });
      y += 18;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }

    doc.moveDown(2);
    doc.text(`Subtotal: $${Number(facturas[0].subtotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Impuestos: $${Number(facturas[0].impuestos).toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: $${Number(facturas[0].total).toFixed(2)}`, { align: 'right' });
    doc.end();
  } catch (error) {
    next(error);
  }
}
