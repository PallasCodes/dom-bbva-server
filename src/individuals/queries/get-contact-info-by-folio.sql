SELECT
    pfc.contacto,
    pf.rfc,
    pf.nombre1,
    pf.nombre2,
    pf.apellidoPaterno,
    pf.apellidoMaterno
FROM
    dbo.personaFisicaContacto pfc WITH (NOLOCK)
    LEFT JOIN dbo.personaFisica pf WITH(NOLOCK) ON pf.idPersonaFisica = pfc.idPersonaFisica
WHERE
    pfc.idPersonaFisica = @idPersonaFisica
    AND pfc.idTipo = @idTipo