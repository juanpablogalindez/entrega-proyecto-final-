USE crece_db;

ALTER TABLE negocios
    ADD COLUMN verificacion_estado ENUM(
        'pendiente',
        'en_revision',
        'requiere_correcciones',
        'verificado',
        'rechazado'
    ) NOT NULL DEFAULT 'pendiente' AFTER verificado,
    ADD COLUMN verificacion_observaciones TEXT NULL AFTER verificacion_estado,
    ADD COLUMN verificacion_fecha DATETIME NULL AFTER verificacion_observaciones;

UPDATE negocios
SET verificacion_estado = CASE
    WHEN verificado = TRUE THEN 'verificado'
    ELSE 'pendiente'
END
WHERE verificacion_estado = 'pendiente';

CREATE TABLE verificacion_requisitos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(80) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_verificacion_requisitos_clave UNIQUE (clave)
) ENGINE=InnoDB;

INSERT INTO verificacion_requisitos (clave, nombre, obligatorio, orden)
VALUES
    ('informacion_veraz', 'Veracidad de la información', TRUE, 1),
    ('identidad_propietario', 'Identidad del propietario', TRUE, 2),
    ('ubicacion', 'Ubicación del negocio', TRUE, 3),
    ('fotografias', 'Fotografías', FALSE, 4),
    ('descripcion', 'Descripción', TRUE, 5),
    ('categoria', 'Categoría comercial', TRUE, 6),
    ('existencia', 'Existencia del negocio', TRUE, 7),
    ('documentacion', 'Documentación y evidencias', FALSE, 8);

CREATE TABLE verificacion_revisiones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    negocio_id INT UNSIGNED NOT NULL,
    administrador_id INT UNSIGNED NOT NULL,
    decision ENUM('verificado', 'requiere_correcciones', 'rechazado') NOT NULL,
    observaciones TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verificacion_revision_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_verificacion_revision_admin FOREIGN KEY (administrador_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_verificacion_revision_negocio_fecha
    ON verificacion_revisiones (negocio_id, fecha_creacion);

CREATE TABLE verificacion_revision_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    revision_id INT UNSIGNED NOT NULL,
    requisito_id INT UNSIGNED NOT NULL,
    resultado ENUM('cumple', 'no_cumple', 'no_verificable') NOT NULL,
    observacion VARCHAR(500) NULL,
    CONSTRAINT uq_verificacion_revision_requisito UNIQUE (revision_id, requisito_id),
    CONSTRAINT fk_verificacion_item_revision FOREIGN KEY (revision_id) REFERENCES verificacion_revisiones(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_verificacion_item_requisito FOREIGN KEY (requisito_id) REFERENCES verificacion_requisitos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_verificacion_item_requisito
    ON verificacion_revision_items (requisito_id);
