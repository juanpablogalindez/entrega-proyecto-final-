-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-09-2026 a las 17:02:45
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `crece_db`
--

DELIMITER $$
--
-- Funciones
--
CREATE DEFINER=`root`@`localhost` FUNCTION `distancia_km` (`lat1` DECIMAL(10,8), `lng1` DECIMAL(11,8), `lat2` DECIMAL(10,8), `lng2` DECIMAL(11,8)) RETURNS DECIMAL(10,3) DETERMINISTIC NO SQL BEGIN
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `capacitaciones`
--

CREATE TABLE `capacitaciones` (
  `id` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `contenido` text DEFAULT NULL COMMENT 'Texto del artículo si aplica',
  `tipo_contenido` enum('video','articulo','pdf','curso') NOT NULL DEFAULT 'articulo',
  `url_recurso` varchar(255) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL COMMENT 'Ej: tributario, marketing, finanzas',
  `duracion_minutos` smallint(5) UNSIGNED DEFAULT NULL,
  `publicado` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_publicacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `capacitaciones`
--

INSERT INTO `capacitaciones` (`id`, `titulo`, `descripcion`, `contenido`, `tipo_contenido`, `url_recurso`, `categoria`, `duracion_minutos`, `publicado`, `fecha_publicacion`) VALUES
(1, '¿Qué es el RUT y cómo tramitarlo?', 'Guía rápida para obtener el Registro Único Tributario en la DIAN.', NULL, 'articulo', NULL, 'tributario', 6, 1, '2026-09-11 08:23:38'),
(2, 'Facturación electrónica en 5 pasos', 'Cómo empezar a facturar electrónicamente sin ser experto en contabilidad.', NULL, 'video', NULL, 'tributario', 8, 1, '2026-09-11 08:23:38'),
(3, 'Primeros pasos para formalizar tu negocio', 'Requisitos básicos de Cámara de Comercio y régimen simple.', NULL, 'pdf', NULL, 'legal', 10, 1, '2026-09-11 08:23:38'),
(4, 'Cómo tomar fotos atractivas de tus productos', 'Tips de fotografía con el celular para tu catálogo.', NULL, 'video', NULL, 'marketing', 5, 1, '2026-09-11 08:23:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `capacitacion_progreso`
--

CREATE TABLE `capacitacion_progreso` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `capacitacion_id` int(10) UNSIGNED NOT NULL,
  `completado` tinyint(1) NOT NULL DEFAULT 0,
  `porcentaje_avance` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `fecha_inicio` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_completado` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `capacitacion_progreso`
--

INSERT INTO `capacitacion_progreso` (`id`, `usuario_id`, `capacitacion_id`, `completado`, `porcentaje_avance`, `fecha_inicio`, `fecha_completado`) VALUES
(1, 7, 4, 1, 100, '2026-09-14 23:50:36', '2026-09-14 23:50:36'),
(2, 5, 2, 1, 100, '2026-09-15 00:23:45', '2026-09-15 00:23:45'),
(3, 5, 1, 1, 100, '2026-09-15 00:27:21', '2026-09-15 00:27:21'),
(5, 7, 1, 1, 100, '2026-09-15 08:33:32', '2026-09-15 08:33:31'),
(6, 5, 3, 1, 100, '2026-09-15 08:43:15', '2026-09-15 08:43:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `icono` varchar(50) DEFAULT NULL COMMENT 'Nombre/clase de ícono para el frontend'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `icono`) VALUES
(1, 'Comida', 'Restaurantes, caf├®s y panader├¡as', 'restaurant'),
(2, 'Belleza', 'Salones, est├®tica y cuidado personal', 'sparkles'),
(3, 'Servicios', 'Reparaci├│n y apoyo local', 'build'),
(4, 'Ropa', 'Boutiques y moda local', 'shirt'),
(5, 'Tecnología y reparaciones', 'Celulares, computadores, electrodomésticos', 'ti-device-laptop'),
(6, 'Hogar y decoración', 'Muebles, artículos para el hogar', 'ti-sofa'),
(7, 'Servicios profesionales', 'Asesorías, contabilidad, diseño', 'ti-briefcase'),
(8, 'Salud y bienestar', 'Farmacias, terapias, cuidado personal', 'ti-heart'),
(9, 'Educación y capacitación', 'Tutorías, cursos, talleres', 'ti-school'),
(10, 'Otros', 'Negocios que no encajan en otra categoría', 'ti-category');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` int(10) UNSIGNED NOT NULL,
  `negocio_id` int(10) UNSIGNED NOT NULL,
  `numero_factura` varchar(30) NOT NULL COMMENT 'Consecutivo visible al cliente, ej: FAC-000123',
  `cliente_nombre` varchar(150) DEFAULT NULL,
  `cliente_documento` varchar(30) DEFAULT NULL,
  `cliente_email` varchar(150) DEFAULT NULL,
  `fecha_emision` datetime NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `impuestos` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` enum('efectivo','transferencia','tarjeta','otro') NOT NULL DEFAULT 'efectivo',
  `estado` enum('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
  `observaciones` text DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id`, `negocio_id`, `numero_factura`, `cliente_nombre`, `cliente_documento`, `cliente_email`, `fecha_emision`, `subtotal`, `impuestos`, `total`, `metodo_pago`, `estado`, `observaciones`) VALUES
(1, 5, 'FAC-000001', 'paula andrea', '131314313342', 'paula@gmail.com', '2026-09-15 10:19:35', 800000.00, 168000.00, 968000.00, 'efectivo', 'pagada', NULL),
(2, 5, 'FAC-000002', 'paula', '1431123', 'paula@gmail.com', '2026-09-15 10:36:15', 2400000.00, 240000.00, 2640000.00, 'efectivo', 'pagada', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura_detalle`
--

CREATE TABLE `factura_detalle` (
  `id` int(10) UNSIGNED NOT NULL,
  `factura_id` int(10) UNSIGNED NOT NULL,
  `producto_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'NULL si el ítem fue eliminado del catálogo luego de facturar',
  `descripcion_item` varchar(150) NOT NULL COMMENT 'Copia del nombre al momento de facturar',
  `cantidad` decimal(10,2) NOT NULL DEFAULT 1.00,
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal_linea` decimal(12,2) NOT NULL
) ;

--
-- Volcado de datos para la tabla `factura_detalle`
--

INSERT INTO `factura_detalle` (`id`, `factura_id`, `producto_id`, `descripcion_item`, `cantidad`, `precio_unitario`, `subtotal_linea`) VALUES
(1, 1, 7, 'margarita', 1.00, 800000.00, 800000.00),
(2, 2, 7, 'margarita', 3.00, 800000.00, 2400000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `favoritos`
--

CREATE TABLE `favoritos` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `negocio_id` int(10) UNSIGNED NOT NULL,
  `fecha_guardado` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `negocios`
--

CREATE TABLE `negocios` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `categoria_id` int(10) UNSIGNED DEFAULT NULL,
  `nombre_negocio` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL COMMENT 'Rango válido -90 a 90',
  `longitud` decimal(11,8) DEFAULT NULL COMMENT 'Rango válido -180 a 180',
  `telefono_negocio` varchar(20) DEFAULT NULL,
  `email_negocio` varchar(150) DEFAULT NULL,
  `horario_atencion` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `formalizado` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Si ya cuenta con RUT/registro formal',
  `estado` enum('pendiente','activo','inactivo') NOT NULL DEFAULT 'pendiente',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `negocios`
--

INSERT INTO `negocios` (`id`, `usuario_id`, `categoria_id`, `nombre_negocio`, `descripcion`, `direccion`, `latitud`, `longitud`, `telefono_negocio`, `email_negocio`, `horario_atencion`, `logo_url`, `formalizado`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(5, 5, 1, 'panaderia su pan', 'una panaderia con las mejores masas y de calidad', 'el parque ', 2.92730000, -75.28190000, '3173219839', 'empresas@gmail.com', 'Lunes a Domingo 9:00 - 18:00', 'http://192.168.18.7:3000/uploads/1789451518990-933606093.png', 1, 'activo', '2026-09-11 11:04:45', '2026-09-15 00:52:02'),
(6, 5, 2, 'Belleza Natural Neiva', 'Salón de belleza y cuidado personal.', 'Carrera 5 # 10-24', 2.92820000, -75.28050000, '3155551001', NULL, 'Lunes a sábado 9:00 - 19:00', NULL, 0, 'activo', '2026-09-15 00:56:22', '2026-09-15 00:56:22'),
(7, 5, 5, 'TecnoHuila Soluciones', 'Reparación de celulares y computadores.', 'Calle 8 # 4-18', 2.92590000, -75.28310000, '3155551002', NULL, 'Lunes a viernes 8:00 - 18:00', NULL, 0, 'activo', '2026-09-15 00:56:22', '2026-09-15 00:56:22'),
(8, 5, 4, 'Moda Sur Boutique', 'Ropa y accesorios para toda la familia.', 'Carrera 2 # 7-32', 2.93010000, -75.27920000, '3155551003', NULL, 'Lunes a sábado 10:00 - 20:00', NULL, 0, 'activo', '2026-09-15 00:56:22', '2026-09-15 00:56:22'),
(9, 5, 8, 'Bienestar Huila', 'Productos y servicios para el cuidado de la salud.', 'Calle 12 # 6-40', 2.92380000, -75.28600000, '3155551004', NULL, 'Lunes a sábado 8:00 - 17:00', NULL, 0, 'activo', '2026-09-15 00:56:22', '2026-09-15 00:56:22'),
(10, 5, 7, 'Impulso Empresarial', 'Asesoría contable y acompañamiento para emprendedores.', 'Carrera 7 # 9-15', 2.93120000, -75.28200000, '3155551005', NULL, 'Lunes a viernes 8:00 - 17:00', NULL, 0, 'activo', '2026-09-15 00:56:22', '2026-09-15 00:56:22'),
(11, 12, 9, 'porstibulo la quinta ', 'babababa', 'calle 44 #2w 01', NULL, NULL, '3154925184', 'prostibulo@gmail.com', 'lunes a sabado 8:00 am 12:00 pm ', 'http://172.20.10.2:3000/uploads/1789487095173-831791813.jpg', 1, 'activo', '2026-09-15 10:44:59', '2026-09-15 10:45:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_servicios`
--

CREATE TABLE `productos_servicios` (
  `id` int(10) UNSIGNED NOT NULL,
  `negocio_id` int(10) UNSIGNED NOT NULL,
  `categoria_id` int(10) UNSIGNED DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tipo` enum('producto','servicio') NOT NULL DEFAULT 'producto',
  `imagen_url` varchar(255) DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `productos_servicios`
--

INSERT INTO `productos_servicios` (`id`, `negocio_id`, `categoria_id`, `nombre`, `descripcion`, `precio`, `tipo`, `imagen_url`, `disponible`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(7, 5, NULL, 'margarita', 'la mejor', 800000.00, 'producto', '/uploads/1789449921586-281575904.jpeg', 1, '2026-09-15 00:25:56', '2026-09-15 00:29:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resenas`
--

CREATE TABLE `resenas` (
  `id` int(10) UNSIGNED NOT NULL,
  `negocio_id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `calificacion` tinyint(3) UNSIGNED NOT NULL COMMENT 'Escala 1 a 5',
  `comentario` text DEFAULT NULL,
  `respuesta_negocio` text DEFAULT NULL COMMENT 'Respuesta opcional del dueño del negocio',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Volcado de datos para la tabla `resenas`
--

INSERT INTO `resenas` (`id`, `negocio_id`, `usuario_id`, `calificacion`, `comentario`, `respuesta_negocio`, `fecha_creacion`) VALUES
(2, 5, 8, 5, 'muy bueno ', 'muchas gracias ', '2026-09-15 00:42:07'),
(3, 5, 7, 5, 'lo mejor ', NULL, '2026-09-15 10:44:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `rol` enum('cliente','negocio','admin') NOT NULL DEFAULT 'cliente',
  `estado` enum('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password_hash`, `telefono`, `rol`, `estado`, `fecha_registro`, `fecha_actualizacion`) VALUES
(5, 'juan pablo', 'juanpa@gmail.com', '$2b$10$b0ZbJUmgKWvOhjtKqmPH0u0SfwSibzpTa3QgDeHS0AIKsJJcJYi6G', '3173933593', 'negocio', 'activo', '2026-09-11 10:45:40', '2026-09-15 08:42:42'),
(7, 'paula', 'paula@gmail.com', '$2b$10$Wjhuor6F8l8WGBPrdH2B1eMlETYu2VGXojjqGCv7D5mLdQhP94TlW', '3132433313', 'cliente', 'activo', '2026-09-11 11:08:28', '2026-09-11 11:08:28'),
(8, 'Cliente Demo', 'cliente@demo.com', '$2b$10$bZ2FifSVdE/TLWzeDzV9ZOsrc31k2/mQ/aGK6nbseepfb4WthjF.C', '3000000001', 'cliente', 'activo', '2026-09-11 11:21:39', '2026-09-11 11:21:39'),
(9, 'Empresa Demo', 'empresa@demo.com', '$2b$10$UGCQInn/pCMji.ih8SF.ce5lZ92CWvQO9.8vLhUwYALG0T1KUakgC', '3000000002', 'negocio', 'activo', '2026-09-11 11:21:39', '2026-09-11 11:21:39'),
(10, 'paula andrea', 'paula.rada16@gmail.com', '$2a$10$GTQMUhgBJqLmxztyPh7SHeU3VmZEzMWx9q/uGGT9zinWRU858GJpy', '3824799541', 'cliente', 'activo', '2026-09-15 09:10:30', '2026-09-15 09:10:30'),
(11, 'juana ortiz', 'juanavalentinaortizvela916@gmail.com', '$2a$10$C1ZAfVxw0CektgDdoMaM1uNnDiR1jLhsVSkQDO0Qbb9y0QXjXGyAS', '3507742751', 'cliente', 'activo', '2026-09-15 09:11:41', '2026-09-15 09:11:41'),
(12, 'Mateo', 'mateocalderonvillavicencio@gmail.com', '$2a$10$AMwG3NG63f1phhMVvU86tO4qCnMfPNak.NKPRYy3zASFuaL1EGCw.', '3154925184', 'negocio', 'activo', '2026-09-15 10:42:57', '2026-09-15 10:42:57');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_negocios_calificacion`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_negocios_calificacion` (
`id` int(10) unsigned
,`nombre_negocio` varchar(150)
,`categoria_id` int(10) unsigned
,`latitud` decimal(10,8)
,`longitud` decimal(11,8)
,`estado` enum('pendiente','activo','inactivo')
,`calificacion_promedio` decimal(6,2)
,`total_resenas` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_negocios_calificacion`
--
DROP TABLE IF EXISTS `vw_negocios_calificacion`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_negocios_calificacion`  AS SELECT `n`.`id` AS `id`, `n`.`nombre_negocio` AS `nombre_negocio`, `n`.`categoria_id` AS `categoria_id`, `n`.`latitud` AS `latitud`, `n`.`longitud` AS `longitud`, `n`.`estado` AS `estado`, round(avg(`r`.`calificacion`),2) AS `calificacion_promedio`, count(`r`.`id`) AS `total_resenas` FROM (`negocios` `n` left join `resenas` `r` on(`r`.`negocio_id` = `n`.`id`)) GROUP BY `n`.`id`, `n`.`nombre_negocio`, `n`.`categoria_id`, `n`.`latitud`, `n`.`longitud`, `n`.`estado` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `capacitaciones`
--
ALTER TABLE `capacitaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_capacitaciones_tipo` (`tipo_contenido`),
  ADD KEY `idx_capacitaciones_publicado` (`publicado`);

--
-- Indices de la tabla `capacitacion_progreso`
--
ALTER TABLE `capacitacion_progreso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_progreso_usuario_capacitacion` (`usuario_id`,`capacitacion_id`),
  ADD KEY `fk_progreso_capacitacion` (`capacitacion_id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categorias_nombre` (`nombre`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_facturas_negocio_numero` (`negocio_id`,`numero_factura`),
  ADD KEY `idx_facturas_negocio` (`negocio_id`),
  ADD KEY `idx_facturas_fecha` (`fecha_emision`),
  ADD KEY `idx_facturas_estado` (`estado`);

--
-- Indices de la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_detalle_factura` (`factura_id`),
  ADD KEY `idx_detalle_producto` (`producto_id`);

--
-- Indices de la tabla `favoritos`
--
ALTER TABLE `favoritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_favoritos_usuario_negocio` (`usuario_id`,`negocio_id`),
  ADD KEY `fk_favoritos_negocio` (`negocio_id`);

--
-- Indices de la tabla `negocios`
--
ALTER TABLE `negocios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_negocios_usuario` (`usuario_id`),
  ADD KEY `idx_negocios_geo` (`latitud`,`longitud`),
  ADD KEY `idx_negocios_categoria` (`categoria_id`),
  ADD KEY `idx_negocios_estado` (`estado`);
ALTER TABLE `negocios` ADD FULLTEXT KEY `ft_negocios_nombre_desc` (`nombre_negocio`,`descripcion`);

--
-- Indices de la tabla `productos_servicios`
--
ALTER TABLE `productos_servicios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_productos_categoria` (`categoria_id`),
  ADD KEY `idx_productos_negocio` (`negocio_id`),
  ADD KEY `idx_productos_tipo` (`tipo`);
ALTER TABLE `productos_servicios` ADD FULLTEXT KEY `ft_productos_nombre_desc` (`nombre`,`descripcion`);

--
-- Indices de la tabla `resenas`
--
ALTER TABLE `resenas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_resenas_negocio_usuario` (`negocio_id`,`usuario_id`),
  ADD KEY `fk_resenas_usuario` (`usuario_id`),
  ADD KEY `idx_resenas_negocio` (`negocio_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `capacitaciones`
--
ALTER TABLE `capacitaciones`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `capacitacion_progreso`
--
ALTER TABLE `capacitacion_progreso`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `favoritos`
--
ALTER TABLE `favoritos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `negocios`
--
ALTER TABLE `negocios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos_servicios`
--
ALTER TABLE `productos_servicios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `resenas`
--
ALTER TABLE `resenas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `capacitacion_progreso`
--
ALTER TABLE `capacitacion_progreso`
  ADD CONSTRAINT `fk_progreso_capacitacion` FOREIGN KEY (`capacitacion_id`) REFERENCES `capacitaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_progreso_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `fk_facturas_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  ADD CONSTRAINT `fk_detalle_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos_servicios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `favoritos`
--
ALTER TABLE `favoritos`
  ADD CONSTRAINT `fk_favoritos_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_favoritos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `negocios`
--
ALTER TABLE `negocios`
  ADD CONSTRAINT `fk_negocios_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_negocios_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos_servicios`
--
ALTER TABLE `productos_servicios`
  ADD CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_productos_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `resenas`
--
ALTER TABLE `resenas`
  ADD CONSTRAINT `fk_resenas_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_resenas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
