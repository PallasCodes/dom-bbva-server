INSERT INTO
    dbo.documentoEdicomDom (
        idOrden,
        UUID,
        tiempoCreacion,
        tags,
        documentTitle,
        documentName,
        folder
    )
VALUES (
        @idOrden,
        @uuid,
        @tiempoCreacion,
        @tags,
        @documentTitle,
        @documentName,
        @folder
    )