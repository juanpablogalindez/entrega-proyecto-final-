USE crece_db;

ALTER TABLE pedidos
    ADD COLUMN metodo_pago ENUM('efectivo', 'transferencia', 'tarjeta', 'otro')
    NOT NULL DEFAULT 'efectivo' AFTER total;
