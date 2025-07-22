SELECT
  COUNT(idPersonaFisica) AS numTries
FROM
  dbo.intentoValidacionToku WITH (NOLOCK)
WHERE
  idPersonaFisica = @idPersonaFisica
  AND tiempoCreacion >= DATEADD(HOUR, -24, GETDATE())