USE crece_db;

CREATE TABLE IF NOT EXISTS notificaciones_pedidos (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id            INT UNSIGNED NOT NULL,
    usuario_id           INT UNSIGNED NOT NULL,
    tipo                 ENUM('confirmado') NOT NULL,
    fecha_creacion        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notificacion_pedido_tipo UNIQUE (pedido_id, tipo),
    CONSTRAINT fk_notificacion_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notificacion_pedido_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notificaciones_pedido_usuario_fecha
    ON notificaciones_pedidos (usuario_id, fecha_creacion);
