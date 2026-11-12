USE crece_db;

CREATE TABLE IF NOT EXISTS pedidos (
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

CREATE TABLE IF NOT EXISTS pedido_detalle (
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
