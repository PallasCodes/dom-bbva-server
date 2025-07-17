SELECT pfc.contacto
FROM dbo.personaFisicaContacto pfc
WITH (NOLOCK)
    LEFT JOIN dbo.orden o
WITH (NOLOCK) ON o.idPersonaFisica = pfc.idPersonaFisica
WHERE
    o.folioInterno = @folioOrden
    AND pfc.idTipo = @idTipo