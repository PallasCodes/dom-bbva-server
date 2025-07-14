UPDATE dbo.solicitudDomiciliacion 
SET firmado = 1
WHERE idOrden = @idOrden