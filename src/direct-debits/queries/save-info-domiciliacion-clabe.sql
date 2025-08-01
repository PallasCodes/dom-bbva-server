UPDATE
    infoDom
SET
    clabe = @clabe
FROM
    dbo.infoDomiciliacion AS infoDom
    LEFT JOIN dbo.solicitudDomiciliacion solDom ON solDom.idSolicitudDom = infoDom.idSolicitudDomiciliacion
WHERE
    solDom.idPersonaFisica = @idPersonaFisica;

INSERT INTO
    dbo.personaFisicaCuentaBancaria(
        idPersonaFisica,
        idTipo,
        idBanco,
        clabe,
        tiempoCreacion
    )
VALUES
    (
        @idPersonaFisica,
        @idTipo,
        @idBanco,
        @clabe,
        GetDate()
    );

UPDATE
    o
SET
    o.idCuentaDomiciliacion = SCOPE_IDENTITY()
FROM
    dbo.orden AS o
WHERE
    o.idPersonaFisica = @idPersonaFisica
    AND o.idEntidad IN (8, 50, 117, 197, 207)
    AND o.idEstatusActual IN (2609, 2656, 2670, 2678, 2682, 2688);

INSERT INTO
    dbo.ordenHistorialCondicionesSolicitud(idOrden, tiempoCreacion, idPersonal, clabeDom)
SELECT
    o.idOrden,
    GetDate(),
    1,
    @clabe
FROM
    dbo.orden o
WHERE
    o.idPersonaFisica = @idPersonaFisica
    AND o.idEntidad IN (8, 50, 117, 197, 207)
    AND o.idEstatusActual IN (2609, 2656, 2670, 2678, 2682, 2688);