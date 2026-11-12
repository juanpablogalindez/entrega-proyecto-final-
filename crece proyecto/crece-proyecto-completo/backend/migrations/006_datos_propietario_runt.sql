USE crece_db;

ALTER TABLE negocios
    ADD COLUMN cedula_propietario VARCHAR(20) NULL
        COMMENT 'Documento de identidad del propietario'
        AFTER formalizado,
    ADD COLUMN runt VARCHAR(30) NULL
        COMMENT 'Registro tributario o identificador legal informado'
        AFTER cedula_propietario;

ALTER TABLE negocios
    ADD COLUMN documento_legalidad_url VARCHAR(500) NULL
        COMMENT 'Documento que acredita la legalidad del negocio'
        AFTER runt;
