SELECT
  od.publicUrl
FROM
  dbo.ordenDocumento od WITH (NOLOCK)
  LEFT JOIN dbo.orden o WITH (NOLOCK) ON o.idOrden = od.idOrden
WHERE
  o.idPersonaFisica = @idPersonaFisica
  AND od.idDocumento = @idDocumento