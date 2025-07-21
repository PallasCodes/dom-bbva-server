UPDATE dbo.solicitudDomiciliacion
SET
    firmado = 1,
    tiempoFirma = GETDATE ()
WHERE
    idOrden = @idOrden