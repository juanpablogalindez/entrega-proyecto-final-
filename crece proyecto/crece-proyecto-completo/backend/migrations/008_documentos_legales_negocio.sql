USE crece_db;

ALTER TABLE negocios
    ADD COLUMN documento_cedula_url VARCHAR(500) NULL
        COMMENT 'Archivo de la cédula del propietario'
        AFTER documento_legalidad_firmado,
    ADD COLUMN documento_rut_url VARCHAR(500) NULL
        COMMENT 'Archivo del RUT del negocio'
        AFTER documento_cedula_url,
    ADD COLUMN documento_camara_comercio_url VARCHAR(500) NULL
        COMMENT 'Archivo de la Cámara de Comercio'
        AFTER documento_rut_url;
