import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

const demoEmails = [
  'admin.demo@crece.test',
  'cliente.demo@crece.test',
  'cliente2.demo@crece.test',
  'emprendedor1.demo@crece.test',
  'emprendedor2.demo@crece.test',
  'emprendedor3.demo@crece.test'
];

const password = 'Crece123!';

async function seed() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'DELETE FROM usuarios WHERE email IN (?)',
      [demoEmails]
    );

    await connection.query(
      `INSERT IGNORE INTO categorias (nombre, descripcion, icono) VALUES
       ('Alimentos', 'Comida y bebidas', 'restaurant-outline'),
       ('Belleza', 'Cuidado personal y belleza', 'cut-outline'),
       ('Hogar', 'Productos y servicios para el hogar', 'home-outline'),
       ('Tecnología', 'Tecnología y accesorios', 'phone-portrait-outline'),
       ('Servicios', 'Servicios profesionales y personales', 'briefcase-outline')`
    );

    const [categories] = await connection.query(
      'SELECT id, nombre FROM categorias WHERE nombre IN (?)',
      [['Alimentos', 'Belleza', 'Hogar', 'Tecnología', 'Servicios']]
    );
    const categoryId = Object.fromEntries(categories.map((category) => [category.nombre, category.id]));
    const passwordHash = await bcrypt.hash(password, 10);

    const users = [
      ['Administración Crece+', 'admin.demo@crece.test', '3000000001', 'admin'],
      ['Cliente Demo', 'cliente.demo@crece.test', '3000000002', 'cliente'],
      ['Cliente Dos', 'cliente2.demo@crece.test', '3000000003', 'cliente'],
      ['Emprendedora Demo', 'emprendedor1.demo@crece.test', '3000000004', 'negocio'],
      ['Emprendedor Dos', 'emprendedor2.demo@crece.test', '3000000005', 'negocio'],
      ['Emprendedora Tres', 'emprendedor3.demo@crece.test', '3000000006', 'negocio']
    ];

    const userIds = {};
    for (const [name, email, phone, role] of users) {
      const [result] = await connection.query(
        `INSERT INTO usuarios
          (nombre_completo, email, password_hash, telefono, rol, estado)
         VALUES (?, ?, ?, ?, ?, 'activo')`,
        [name, email, passwordHash, phone, role]
      );
      userIds[email] = result.insertId;
    }

    const businesses = [
      {
        email: 'emprendedor1.demo@crece.test',
        category: 'Alimentos',
        name: 'Sabor Opita',
        description: 'Comida casera huilense, desayunos y almuerzos preparados con ingredientes locales.',
        address: 'Carrera 5 # 10-25, Neiva',
        phone: '3000000101',
        lat: 2.9273,
        lng: -75.2819,
        status: 'activo',
        verified: 1,
        formalized: 1,
        schedule: 'Lun a Sáb 7:00 a.m. - 6:00 p.m.'
      },
      {
        email: 'emprendedor2.demo@crece.test',
        category: 'Belleza',
        name: 'Luz & Estilo',
        description: 'Servicios de manicure, barbería y cuidado personal para toda la familia.',
        address: 'Calle 8 # 12-40, Neiva',
        phone: '3000000102',
        lat: 2.9341,
        lng: -75.2704,
        status: 'activo',
        verified: 1,
        formalized: 0,
        schedule: 'Mar a Dom 9:00 a.m. - 7:00 p.m.'
      },
      {
        email: 'emprendedor3.demo@crece.test',
        category: 'Tecnología',
        name: 'Tecno Huila',
        description: 'Accesorios, reparación y soporte para celulares y computadores.',
        address: 'Carrera 7 # 18-12, Neiva',
        phone: '3000000103',
        lat: 2.9185,
        lng: -75.2897,
        status: 'pendiente',
        verified: 0,
        formalized: 0,
        schedule: 'Lun a Vie 8:00 a.m. - 5:30 p.m.'
      }
    ];

    const businessIds = {};
    for (const business of businesses) {
      const [result] = await connection.query(
        `INSERT INTO negocios
          (usuario_id, categoria_id, nombre_negocio, descripcion, direccion,
           latitud, longitud, telefono_negocio, email_negocio, horario_atencion,
           formalizado, verificado, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userIds[business.email],
          categoryId[business.category],
          business.name,
          business.description,
          business.address,
          business.lat,
          business.lng,
          business.phone,
          business.email,
          business.schedule,
          business.formalized,
          business.verified,
          business.status
        ]
      );
      businessIds[business.email] = result.insertId;
    }

    const productSets = [
      ['Sabor Opita', businessIds['emprendedor1.demo@crece.test'], categoryId.Alimentos, [
        ['Almuerzo ejecutivo', 'Sopa, seco, ensalada y bebida del día.', 18000, 'producto'],
        ['Tamal huilense', 'Tamal tradicional preparado en casa.', 9000, 'producto'],
        ['Arepa con queso', 'Arepa de maíz blanco con queso derretido.', 6500, 'producto'],
        ['Jugo natural', 'Jugo natural de mango, mora o lulo.', 5000, 'producto'],
        ['Desayuno campesino', 'Huevos, arepa, chocolate y fruta.', 12000, 'producto'],
        ['Catering para eventos', 'Servicio de alimentación para reuniones pequeñas.', 35000, 'servicio']
      ]],
      ['Luz & Estilo', businessIds['emprendedor2.demo@crece.test'], categoryId.Belleza, [
        ['Manicure tradicional', 'Limpieza, limado y esmaltado.', 22000, 'servicio'],
        ['Manicure semipermanente', 'Esmaltado de larga duración.', 38000, 'servicio'],
        ['Corte masculino', 'Corte personalizado y asesoría de estilo.', 18000, 'servicio'],
        ['Diseño de cejas', 'Perfilado y diseño de cejas.', 12000, 'servicio'],
        ['Kit de cuidado capilar', 'Champú, acondicionador y tratamiento.', 45000, 'producto'],
        ['Peinado para evento', 'Peinado social para ocasiones especiales.', 55000, 'servicio']
      ]],
      ['Tecno Huila', businessIds['emprendedor3.demo@crece.test'], categoryId.Tecnología, [
        ['Cargador USB-C', 'Cargador de carga rápida compatible.', 28000, 'producto'],
        ['Vidrio templado', 'Protección para pantalla de celular.', 12000, 'producto'],
        ['Audífonos inalámbricos', 'Audífonos Bluetooth con estuche.', 65000, 'producto'],
        ['Cable de datos', 'Cable reforzado para carga y transferencia.', 18000, 'producto'],
        ['Soporte para celular', 'Soporte ajustable para escritorio.', 25000, 'producto'],
        ['Diagnóstico de computador', 'Revisión básica y diagnóstico técnico.', 30000, 'servicio']
      ]]
    ];

    const productIds = [];
    for (const [, businessId, categoryIdValue, products] of productSets) {
      for (const [name, description, price, type] of products) {
        const [result] = await connection.query(
          `INSERT INTO productos_servicios
            (negocio_id, categoria_id, nombre, descripcion, precio, tipo, disponible)
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [businessId, categoryIdValue, name, description, price, type]
        );
        productIds.push({ id: result.insertId, businessId, name, price });
      }
    }

    const saborProducts = productIds.filter((product) => product.businessId === businessIds['emprendedor1.demo@crece.test']);
    const luzProducts = productIds.filter((product) => product.businessId === businessIds['emprendedor2.demo@crece.test']);

    const orders = [
      [businessIds['emprendedor1.demo@crece.test'], userIds['cliente.demo@crece.test'], 27000, 'efectivo', 'pendiente', saborProducts.slice(0, 2)],
      [businessIds['emprendedor1.demo@crece.test'], userIds['cliente2.demo@crece.test'], 23000, 'transferencia', 'preparando', saborProducts.slice(2, 4)],
      [businessIds['emprendedor1.demo@crece.test'], userIds['cliente.demo@crece.test'], 18000, 'efectivo', 'entregado', saborProducts.slice(0, 1)],
      [businessIds['emprendedor2.demo@crece.test'], userIds['cliente2.demo@crece.test'], 56000, 'tarjeta', 'confirmado', luzProducts.slice(0, 2)],
      [businessIds['emprendedor2.demo@crece.test'], userIds['cliente.demo@crece.test'], 18000, 'otro', 'cancelado', luzProducts.slice(2, 3)]
    ];

    const orderIds = [];
    for (const [businessId, userId, total, payment, status, products] of orders) {
      const [result] = await connection.query(
        `INSERT INTO pedidos
          (negocio_id, usuario_id, total, metodo_pago, estado, observaciones)
         VALUES (?, ?, ?, ?, ?, 'Pedido de demostración para el manual de usuario')`,
        [businessId, userId, total, payment, status]
      );
      orderIds.push(result.insertId);
      for (const product of products) {
        const quantity = 1;
        await connection.query(
          `INSERT INTO pedido_detalle
            (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal_linea)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [result.insertId, product.id, product.name, quantity, product.price, product.price]
        );
      }
    }

    await connection.query(
      `INSERT INTO resenas (negocio_id, usuario_id, calificacion, comentario)
       VALUES (?, ?, 5, 'Excelente atención y productos muy ricos.'),
              (?, ?, 4, 'Muy buen servicio y catálogo variado.'),
              (?, ?, 5, 'Me atendieron rápido y con amabilidad.')`,
      [
        businessIds['emprendedor1.demo@crece.test'], userIds['cliente.demo@crece.test'],
        businessIds['emprendedor1.demo@crece.test'], userIds['cliente2.demo@crece.test'],
        businessIds['emprendedor2.demo@crece.test'], userIds['cliente.demo@crece.test']
      ]
    );

    await connection.query(
      `INSERT INTO favoritos (usuario_id, negocio_id) VALUES
       (?, ?), (?, ?), (?, ?)`,
      [
        userIds['cliente.demo@crece.test'], businessIds['emprendedor1.demo@crece.test'],
        userIds['cliente.demo@crece.test'], businessIds['emprendedor2.demo@crece.test'],
        userIds['cliente2.demo@crece.test'], businessIds['emprendedor1.demo@crece.test']
      ]
    );

    const courseTitles = [
      ['Cómo formalizar tu emprendimiento', 'Conoce los primeros pasos para formalizar tu negocio.', 'curso', 'formalización', 25],
      ['Finanzas para pequeños negocios', 'Aprende a separar costos, ingresos y ganancias.', 'articulo', 'finanzas', 15],
      ['Marketing local', 'Ideas sencillas para promocionar tu negocio en tu comunidad.', 'video', 'marketing', 20],
      ['Atención al cliente', 'Buenas prácticas para crear relaciones duraderas.', 'articulo', 'ventas', 12],
      ['Precios y costos', 'Calcula precios sostenibles para tus productos y servicios.', 'curso', 'finanzas', 30],
      ['Catálogo digital', 'Presenta mejor tus productos en medios digitales.', 'pdf', 'marketing', 18]
    ];
    const courseIds = [];
    for (const [title, description, type, category, minutes] of courseTitles) {
      const [existing] = await connection.query(
        'SELECT id FROM capacitaciones WHERE titulo = ? LIMIT 1',
        [title]
      );
      if (existing.length) {
        courseIds.push(existing[0].id);
      } else {
        const [result] = await connection.query(
          `INSERT INTO capacitaciones
            (titulo, descripcion, contenido, tipo_contenido, categoria, duracion_minutos, publicado)
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [title, description, description, type, category, minutes]
        );
        courseIds.push(result.insertId);
      }
    }

    await connection.query(
      `INSERT INTO capacitacion_progreso
        (usuario_id, capacitacion_id, completado, porcentaje_avance, fecha_completado)
       VALUES (?, ?, TRUE, 100, NOW()), (?, ?, FALSE, 35, NULL)
       ON DUPLICATE KEY UPDATE
         completado = VALUES(completado),
         porcentaje_avance = VALUES(porcentaje_avance),
         fecha_completado = VALUES(fecha_completado)`,
      [userIds['cliente.demo@crece.test'], courseIds[0], userIds['cliente.demo@crece.test'], courseIds[1]]
    );

    await connection.query(
      `INSERT INTO facturas
        (negocio_id, numero_factura, cliente_nombre, cliente_documento, cliente_email,
         subtotal, impuestos, total, metodo_pago, estado, observaciones)
       VALUES (?, 'FAC-DEMO-001', 'Cliente Demo', 'DEMO-1001', 'cliente.demo@crece.test',
               18000, 0, 18000, 'efectivo', 'pagada', 'Factura de demostración')`,
      [businessIds['emprendedor1.demo@crece.test']]
    );
    const [invoice] = await connection.query(
      `SELECT id FROM facturas WHERE negocio_id = ? AND numero_factura = 'FAC-DEMO-001'`,
      [businessIds['emprendedor1.demo@crece.test']]
    );
    await connection.query(
      `INSERT INTO factura_detalle
        (factura_id, producto_id, descripcion_item, cantidad, precio_unitario, subtotal_linea)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [invoice[0].id, saborProducts[0].id, saborProducts[0].name, saborProducts[0].price, saborProducts[0].price]
    );

    await connection.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, ruta)
       VALUES (?, 'pedido-confirmado', 'Pedido confirmado', 'Tu pedido de demostración fue confirmado por el negocio.', '/tabs/perfil'),
              (?, 'factura', 'Nueva factura', 'Tienes una factura de demostración disponible.', ?)`,
      [
        userIds['cliente.demo@crece.test'],
        userIds['emprendedor1.demo@crece.test'],
        `/factura/${invoice[0].id}`
      ]
    );

    await connection.commit();
    console.log('Datos demo creados correctamente.');
    console.log('Credenciales:');
    for (const [, email, , role] of users) {
      console.log(`${role}: ${email} / ${password}`);
    }
  } catch (error) {
    await connection.rollback();
    console.error('No fue posible crear los datos demo:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
