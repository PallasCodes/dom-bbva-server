UPDATE infoDom
SET
    clabe = @clabe
FROM dbo.infoDomiciliacion AS infoDom
WITH (NOLOCK)
    LEFT JOIN dbo.solicitudDomiciliacion solDom
WITH (NOLOCK) ON solDom.idSolicitudDom = infoDom.idSolicitudDomiciliacion
WHERE
    solDom.idOrden = @idOrden