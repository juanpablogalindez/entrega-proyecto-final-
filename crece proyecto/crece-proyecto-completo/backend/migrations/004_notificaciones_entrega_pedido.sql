USE crece_db;

ALTER TABLE notificaciones_pedidos
    MODIFY COLUMN tipo ENUM('confirmado', 'entregado') NOT NULL;
