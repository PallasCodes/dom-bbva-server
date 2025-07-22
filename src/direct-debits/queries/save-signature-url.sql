UPDATE
  dbo.solicitudDomiciliacion
SET
  publicUrl = @publicUrl
FROM
  dbo.solicitudDomiciliacion
WHERE
  idPersonaFisica = @idPersonaFisica