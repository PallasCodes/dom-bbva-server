SELECT
  o.idPersonaFisica,
  o.idEstatusActual,
  o.idEntidad
FROM
  dbo.orden o WITH(NOLOCK)
WHERE
  o.idPersonaFisica = @idPersonaFisica
  AND o.idEstatusActual IN (2609, 2656, 2670, 2678, 2682, 2688)
  AND o.idEntidad IN (8, 50, 117, 197, 207)