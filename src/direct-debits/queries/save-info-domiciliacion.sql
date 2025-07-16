IF EXISTS (
    SELECT 1
    FROM dbo.infoDomiciliacion
    WITH (NOLOCK)
    WHERE
        idSolicitudDomiciliacion = @idSolicitudDomiciliacion
) BEGIN
-- Si existe: actualiza
UPDATE dbo.infoDomiciliacion
SET
    nombre1 = @nombre1,
    nombre2 = @nombre2,
    apellidoPaterno = @apellidoPaterno,
    apellidoMaterno = @apellidoMaterno,
    rfc = @rfc,
    curp = @curp,
    sexo = @sexo
WHERE
    idSolicitudDomiciliacion = @idSolicitudDomiciliacion END ELSE BEGIN
    -- Si no existe: inserta
INSERT INTO
    dbo.infoDomiciliacion (
        nombre1,
        nombre2,
        apellidoPaterno,
        apellidoMaterno,
        rfc,
        curp,
        sexo,
        idSolicitudDomiciliacion
    )
VALUES (
        @nombre1,
        @nombre2,
        @apellidoPaterno,
        @apellidoMaterno,
        @rfc,
        @curp,
        @sexo,
        @idSolicitudDomiciliacion
    ) END