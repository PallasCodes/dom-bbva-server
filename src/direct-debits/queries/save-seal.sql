UPDATE
  dbo.solicitudDomiciliacion
SET
  selloClear = @selloClear,
  sello = @sello
WHERE
  idPersonaFisica = @idPersonaFisica