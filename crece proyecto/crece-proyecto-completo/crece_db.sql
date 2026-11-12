
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS crece_db;
CREATE DATABASE crece_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE crece_db;

-- =====================================================================
-- 1. USUARIOS
-- Cuenta base para cualquier persona que use la plataforma:
-- dueños de negocio, clientes que buscan/califican, y administradores.
-- =====================================================================
CREATE TABLE usuarios (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_completo      VARCHAR(150)        NOT NULL,
    email               VARCHAR(150)        NOT NULL,
    password_hash       VARCHAR(255)        NOT NULL,
    telefono            VARCHAR(20)         NULL,
    rol                 ENUM('cliente', 'negocio', 'admin') NOT NULL DEFAULT 'cliente',
    estado              ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
    fecha_registro       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. CATEGORIAS
-- Catálogo de rubros/categorías, reutilizado tanto por negocios
-- como por productos y servicios (ej: "Comida", "Belleza", "Ferretería").
-- =====================================================================
CREATE TABLE categorias (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100)  NOT NULL,
    descripcion  VARCHAR(255)  NULL,
    icono        VARCHAR(50)   NULL COMMENT 'Nombre/clase de ícono para el frontend',
    CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. NEGOCIOS
-- Perfil del negocio informal/formal registrado por un usuario con rol
-- 'negocio'. Incluye geolocalización para el buscador por cercanía.
-- =====================================================================
CREATE TABLE negocios (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id           INT UNSIGNED  NOT NULL,
    categoria_id         INT UNSIGNED  NULL,
    nombre_negocio        VARCHAR(150)  NOT NULL,
    descripcion          TEXT          NULL,
    direccion            VARCHAR(255)  NULL,
    latitud              DECIMAL(10,8) NULL COMMENT 'Rango válido -90 a 90',
    longitud             DECIMAL(11,8) NULL COMMENT 'Rango válido -180 a 180',
    telefono_negocio      VARCHAR(20)   NULL,
    email_negocio         VARCHAR(150)  NULL,
    horario_atencion      VARCHAR(255)  NULL,
    logo_url             VARCHAR(255)  NULL,
    formalizado          BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'Si ya cuenta con RUT/registro formal',
    cedula_propietario   VARCHAR(20)   NULL COMMENT 'Documento de identidad del propietario',
    runt                 VARCHAR(30)   NULL COMMENT 'Registro tributario o identificador legal informado',
    documento_legalidad_url VARCHAR(500) NULL COMMENT 'Documento de legalidad legado',
    documento_legalidad_firmado BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Documento legado cargado firmado',
    documento_cedula_url VARCHAR(500) NULL COMMENT 'Archivo de la cédula del propietario',
    documento_rut_url VARCHAR(500) NULL COMMENT 'Archivo del RUT del negocio',
    documento_camara_comercio_url VARCHAR(500) NULL COMMENT 'Archivo de la Cámara de Comercio',
    verificado           BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'Verificado por un administrador',
    estado               ENUM('pendiente', 'activo', 'inactivo') NOT NULL DEFAULT 'pendiente',
    fecha_creacion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_negocios_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_negocios_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_negocios_lat CHECK (latitud  IS NULL OR (latitud  BETWEEN -90  AND 90)),
    CONSTRAINT chk_negocios_lng CHECK (longitud IS NULL OR (longitud BETWEEN -180 AND 180))
) ENGINE=InnoDB;

-- Índice compuesto para acelerar el filtrado inicial por bounding-box
-- antes de aplicar la fórmula de Haversine (ver vista/función más abajo).
CREATE INDEX idx_negocios_geo ON negocios (latitud, longitud);
CREATE INDEX idx_negocios_categoria ON negocios (categoria_id);
CREATE INDEX idx_negocios_estado ON negocios (estado);
CREATE FULLTEXT INDEX ft_negocios_nombre_desc ON negocios (nombre_negocio, descripcion);

-- =====================================================================
-- 4. PRODUCTOS_SERVICIOS
-- Catálogo de productos/servicios que ofrece cada negocio.
-- =====================================================================
CREATE TABLE productos_servicios (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    negocio_id           INT UNSIGNED  NOT NULL,
    categoria_id         INT UNSIGNED  NULL,
    nombre               VARCHAR(150)  NOT NULL,
    descripcion          TEXT          NULL,
    precio               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tipo                 ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
    imagen_url            VARCHAR(255)  NULL,
    disponible           BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_creacion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_negocio
        FOREIGN KEY (negocio_id) REFERENCES negocios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_productos_precio CHECK (precio >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_productos_negocio ON productos_servicios (negocio_id);
CREATE INDEX idx_productos_tipo ON productos_servicios (tipo);
CREATE FULLTEXT INDEX ft_productos_nombre_desc ON productos_servicios (nombre, descripcion);

-- =====================================================================
-- 5. PEDIDOS
-- Pedidos realizados por clientes a negocios desde el catálogo.
-- =====================================================================
CREATE TABLE pedidos (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    negocio_id           INT UNSIGNED NOT NULL,
    usuario_id           INT UNSIGNED NOT NULL,
    fecha_creacion        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total                 DECIMAL(12,2) NOT NULL,
    metodo_pago           ENUM('efectivo', 'transferencia', 'tarjeta', 'otro') NOT NULL DEFAULT 'efectivo',
    estado                ENUM('pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado')
                          NOT NULL DEFAULT 'pendiente',
    observaciones         VARCHAR(1000) NULL,
    CONSTRAINT fk_pedidos_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_pedidos_total CHECK (total >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_pedidos_negocio_fecha ON pedidos (negocio_id, fecha_creacion);
CREATE INDEX idx_pedidos_usuario_fecha ON pedidos (usuario_id, fecha_creacion);
CREATE INDEX idx_pedidos_estado ON pedidos (estado);

CREATE TABLE pedido_detalle (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id            INT UNSIGNED NOT NULL,
    producto_id          INT UNSIGNED NULL,
    nombre_producto      VARCHAR(150) NOT NULL,
    cantidad             INT UNSIGNED NOT NULL,
    precio_unitario      DECIMAL(12,2) NOT NULL,
    subtotal_linea       DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_pedido_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos_servicios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_pedido_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_pedido_detalle_precios CHECK (precio_unitario >= 0 AND subtotal_linea >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_pedido_detalle_pedido ON pedido_detalle (pedido_id);

CREATE TABLE notificaciones_pedidos (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id            INT UNSIGNED NOT NULL,
    usuario_id           INT UNSIGNED NOT NULL,
    tipo                 ENUM('confirmado', 'entregado') NOT NULL,
    fecha_creacion        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notificacion_pedido_tipo UNIQUE (pedido_id, tipo),
    CONSTRAINT fk_notificacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notificacion_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notificaciones_pedido_usuario_fecha
    ON notificaciones_pedidos (usuario_id, fecha_creacion);

CREATE TABLE notificaciones (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT UNSIGNED NOT NULL,
    tipo            VARCHAR(50) NOT NULL,
    titulo          VARCHAR(150) NOT NULL,
    mensaje         VARCHAR(500) NOT NULL,
    ruta            VARCHAR(255) NOT NULL,
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notificaciones_usuario_fecha
    ON notificaciones (usuario_id, fecha_creacion);

-- =====================================================================
-- 7. FACTURAS
-- Encabezado de facturación electrónica básica emitida por un negocio.
-- =====================================================================
CREATE TABLE facturas (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    negocio_id           INT UNSIGNED  NOT NULL,
    numero_factura        VARCHAR(30)   NOT NULL COMMENT 'Consecutivo visible al cliente, ej: FAC-000123',
    cliente_nombre        VARCHAR(150)  NULL,
    cliente_documento     VARCHAR(30)   NULL,
    cliente_email         VARCHAR(150)  NULL,
    fecha_emision         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impuestos            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    metodo_pago           ENUM('efectivo', 'transferencia', 'tarjeta', 'otro') NOT NULL DEFAULT 'efectivo',
    estado               ENUM('pendiente', 'pagada', 'anulada') NOT NULL DEFAULT 'pendiente',
    observaciones         TEXT          NULL,
    CONSTRAINT fk_facturas_negocio
        FOREIGN KEY (negocio_id) REFERENCES negocios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_facturas_negocio_numero UNIQUE (negocio_id, numero_factura),
    CONSTRAINT chk_facturas_totales CHECK (subtotal >= 0 AND impuestos >= 0 AND total >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_facturas_negocio ON facturas (negocio_id);
CREATE INDEX idx_facturas_fecha ON facturas (fecha_emision);
CREATE INDEX idx_facturas_estado ON facturas (estado);

-- =====================================================================
-- 8. FACTURA_DETALLE
-- Líneas/ítems de cada factura, referenciando el catálogo.
-- =====================================================================
CREATE TABLE factura_detalle (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    factura_id           INT UNSIGNED  NOT NULL,
    producto_id          INT UNSIGNED  NULL COMMENT 'NULL si el ítem fue eliminado del catálogo luego de facturar',
    descripcion_item      VARCHAR(150)  NOT NULL COMMENT 'Copia del nombre al momento de facturar',
    cantidad             DECIMAL(10,2) NOT NULL DEFAULT 1,
    precio_unitario       DECIMAL(12,2) NOT NULL,
    subtotal_linea        DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_detalle_factura
        FOREIGN KEY (factura_id) REFERENCES facturas(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id) REFERENCES productos_servicios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_detalle_factura ON factura_detalle (factura_id);
CREATE INDEX idx_detalle_producto ON factura_detalle (producto_id);

-- =====================================================================
-- 7. CAPACITACIONES
-- Contenido corto de formalización (videos, artículos, PDFs, cursos).
-- =====================================================================
CREATE TABLE capacitaciones (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo               VARCHAR(150)  NOT NULL,
    descripcion          TEXT          NULL,
    contenido            TEXT          NULL COMMENT 'Texto del artículo si aplica',
    tipo_contenido        ENUM('video', 'articulo', 'pdf', 'curso') NOT NULL DEFAULT 'articulo',
    url_recurso           VARCHAR(255)  NULL,
    categoria             VARCHAR(100)  NULL COMMENT 'Ej: tributario, marketing, finanzas',
    duracion_minutos      SMALLINT UNSIGNED NULL,
    publicado            BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_publicacion     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_capacitaciones_tipo ON capacitaciones (tipo_contenido);
CREATE INDEX idx_capacitaciones_publicado ON capacitaciones (publicado);

-- =====================================================================
-- 8. CAPACITACION_PROGRESO
-- Seguimiento de qué contenidos ha completado cada usuario.
-- =====================================================================
CREATE TABLE capacitacion_progreso (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id           INT UNSIGNED  NOT NULL,
    capacitacion_id       INT UNSIGNED  NOT NULL,
    completado           BOOLEAN       NOT NULL DEFAULT FALSE,
    porcentaje_avance     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    fecha_inicio          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completado      DATETIME      NULL,
    CONSTRAINT fk_progreso_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_progreso_capacitacion
        FOREIGN KEY (capacitacion_id) REFERENCES capacitaciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_progreso_usuario_capacitacion UNIQUE (usuario_id, capacitacion_id),
    CONSTRAINT chk_progreso_pct CHECK (porcentaje_avance BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. RESENAS
-- Calificaciones y comentarios de clientes hacia un negocio.
-- =====================================================================
CREATE TABLE resenas (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    negocio_id           INT UNSIGNED  NOT NULL,
    usuario_id           INT UNSIGNED  NOT NULL,
    calificacion         TINYINT UNSIGNED NOT NULL COMMENT 'Escala 1 a 5',
    comentario           TEXT          NULL,
    respuesta_negocio     TEXT          NULL COMMENT 'Respuesta opcional del dueño del negocio',
    fecha_creacion        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resenas_negocio
        FOREIGN KEY (negocio_id) REFERENCES negocios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resenas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_resenas_negocio_usuario UNIQUE (negocio_id, usuario_id),
    CONSTRAINT chk_resenas_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE INDEX idx_resenas_negocio ON resenas (negocio_id);

-- =====================================================================
-- 10. FAVORITOS (opcional, soporta "negocios guardados" del cliente)
-- =====================================================================
CREATE TABLE favoritos (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id    INT UNSIGNED  NOT NULL,
    negocio_id    INT UNSIGNED  NOT NULL,
    fecha_guardado DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favoritos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_favoritos_negocio
        FOREIGN KEY (negocio_id) REFERENCES negocios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_favoritos_usuario_negocio UNIQUE (usuario_id, negocio_id)
) ENGINE=InnoDB;

-- =====================================================================
-- VISTA: negocios con su calificación promedio
-- Útil para listar resultados del buscador con rating ya calculado.
-- =====================================================================
CREATE OR REPLACE VIEW vw_negocios_calificacion AS
SELECT
    n.id,
    n.nombre_negocio,
    n.categoria_id,
    n.latitud,
    n.longitud,
    n.estado,
    ROUND(AVG(r.calificacion), 2) AS calificacion_promedio,
    COUNT(r.id)                   AS total_resenas
FROM negocios n
LEFT JOIN resenas r ON r.negocio_id = n.id
GROUP BY n.id, n.nombre_negocio, n.categoria_id, n.latitud, n.longitud, n.estado;

-- =====================================================================
-- FUNCIÓN: distancia_km
-- Fórmula de Haversine para el buscador de negocios por cercanía
-- geográfica. Uso típico:
--   SELECT *, distancia_km(lat_usuario, lng_usuario, latitud, longitud) AS distancia
--   FROM negocios
--   HAVING distancia <= 5
--   ORDER BY distancia;
-- =====================================================================
DELIMITER $$

CREATE FUNCTION distancia_km(
    lat1 DECIMAL(10,8), lng1 DECIMAL(11,8),
    lat2 DECIMAL(10,8), lng2 DECIMAL(11,8)
)
RETURNS DECIMAL(10,3)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE radio_tierra DECIMAL(10,3) DEFAULT 6371.0; -- km
    DECLARE dlat, dlng, a, c DECIMAL(20,15);

    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN NULL;
    END IF;

    SET dlat = RADIANS(lat2 - lat1);
    SET dlng = RADIANS(lng2 - lng1);
    SET a = SIN(dlat/2) * SIN(dlat/2) +
            COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
            SIN(dlng/2) * SIN(dlng/2);
    SET c = 2 * ATAN2(SQRT(a), SQRT(1 - a));

    RETURN radio_tierra * c;
END$$

DELIMITER ;

-- =====================================================================
-- DATOS SEMILLA: categorías base (Acta 002 - segmento de usuarios:
-- emprendedores informales y negocios familiares de Neiva y el Huila)
-- =====================================================================
INSERT INTO categorias (nombre, descripcion, icono) VALUES
    ('Alimentos y bebidas',     'Restaurantes, comidas rápidas, panaderías, tiendas de barrio', 'ti-tools-kitchen-2'),
    ('Belleza y cuidado personal', 'Peluquerías, barberías, estética', 'ti-scissors'),
    ('Moda y textiles',         'Ropa, calzado, confección', 'ti-shirt'),
    ('Ferretería y construcción', 'Materiales, herramientas, servicios de construcción', 'ti-hammer'),
    ('Tecnología y reparaciones', 'Celulares, computadores, electrodomésticos', 'ti-device-laptop'),
    ('Hogar y decoración',       'Muebles, artículos para el hogar', 'ti-sofa'),
    ('Servicios profesionales',  'Asesorías, contabilidad, diseño', 'ti-briefcase'),
    ('Salud y bienestar',        'Farmacias, terapias, cuidado personal', 'ti-heart'),
    ('Educación y capacitación', 'Tutorías, cursos, talleres', 'ti-school'),
    ('Otros',                   'Negocios que no encajan en otra categoría', 'ti-category');

-- =====================================================================
-- DATOS SEMILLA: capacitaciones iniciales (módulo de formalización)
-- =====================================================================
INSERT INTO capacitaciones (titulo, descripcion, tipo_contenido, categoria, duracion_minutos) VALUES
    ('¿Qué es el RUT y cómo tramitarlo?', 'Guía rápida para obtener el Registro Único Tributario en la DIAN.', 'articulo', 'tributario', 6),
    ('Facturación electrónica en 5 pasos', 'Cómo empezar a facturar electrónicamente sin ser experto en contabilidad.', 'video', 'tributario', 8),
    ('Primeros pasos para formalizar tu negocio', 'Requisitos básicos de Cámara de Comercio y régimen simple.', 'pdf', 'legal', 10),
    ('Cómo tomar fotos atractivas de tus productos', 'Tips de fotografía con el celular para tu catálogo.', 'video', 'marketing', 5);

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
