SELECT
    pfc.contacto
FROM
    dbo.personaFisicaContacto pfc WITH (NOLOCK)
WHERE
    pfc.idPersonaFisica = @idPersonaFisica
    AND pfc.idTipo = @idTipo