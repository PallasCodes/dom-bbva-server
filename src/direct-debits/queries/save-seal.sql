UPDATE dbo.solicitudDomiciliacion
SET 
  selloClear = @selloClear,
  sello = @sello
WHERE idOrden = @idOrden