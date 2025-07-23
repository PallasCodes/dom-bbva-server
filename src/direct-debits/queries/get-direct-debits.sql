SELECT
    pf.rfc,
    od.publicUrl,
    o.folioInterno,
    o.idOrden
FROM
    dbo.orden o WITH (NOLOCK)
    LEFT JOIN dbo.personaFisica pf WITH (NOLOCK) ON pf.idPersonaFisica = o.idPersonaFisica
    LEFT JOIN dbo.ordenDocumento od WITH (NOLOCK) ON od.idOrden = o.idOrden
    AND idDocumento = @idDocumento
WHERE
    o.idEntidad IN (8, 50, 117, 197, 207)
    AND pf.idPersonaFisica = @idPersonafisica
    AND o.idEstatus IN (2609, 2656, 2670, 2678, 2682, 2688)