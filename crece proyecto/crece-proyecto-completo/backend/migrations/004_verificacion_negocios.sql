USE crece_db;

ALTER TABLE negocios
    ADD COLUMN verificado BOOLEAN NOT NULL DEFAULT FALSE
    AFTER formalizado;

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
