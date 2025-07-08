SELECT 
  * 
FROM dbo.solicitudDomiciliacion sd WITH (NOLOCK)
WHERE sd.idOrden = @idOrden