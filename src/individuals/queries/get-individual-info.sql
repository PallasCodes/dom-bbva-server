SELECT
    pf.nombre1,
    pf.nombre2,
    pf.apellidoPaterno,
    pf.apellidoMaterno,
    pf.rfc,
    pf.curp,
    pf.idNacionalidad,
    pf.idEstadoCivil,
    pf.dependientes
FROM
    dbo.personaFisica pf WITH (NOLOCK)
WHERE
    pf.idPersonaFisica = @idPersonaFisica