UPDATE
  solDom
SET
  folios = @folios
FROM
  dbo.solicitudDomiciliacion solDom
WHERE
  solDom.idPersonaFisica = @idPersonaFisica