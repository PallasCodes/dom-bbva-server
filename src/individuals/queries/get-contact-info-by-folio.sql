SELECT
    pfc.contacto
FROM
    dbo.personaFisicaContacto pfc WITH (NOLOCK)
WHERE
    pfc.idPersonaFisisca = @idPersonaFisica
    AND pfc.idTipo = @idTipo