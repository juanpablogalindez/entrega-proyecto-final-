USE crece_db;

ALTER TABLE negocios
    ADD COLUMN documento_legalidad_firmado BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Indica si el documento de legalidad fue cargado firmado por el propietario'
        AFTER documento_legalidad_url;
