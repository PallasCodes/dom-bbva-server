INSERT INTO
    dbo.documentoEdicomDom (
        idOrden,
        UUID,
        tags,
        documentTitle,
        documentName,
        folder
    )
VALUES (
        @idOrden,
        @uuid,
        @tags,
        @documentTitle,
        @documentName,
        @folder
    )