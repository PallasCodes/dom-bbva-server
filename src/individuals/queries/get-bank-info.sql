SELECT pf.nombre1, pf.nombre2, pf.apellidoPaterno, pf.apellidoMaterno, pf.rfc, pf.curp, pf.idNacionalidad, pf.idEstadoCivil, pf.dependientes
FROM dbo.orden o
WITH (NOLOCK)
    LEFT JOIN dbo.personaFisica pf
WITH (NOLOCK) ON pf.idPersonaFisica = o.idPersonaFisica
WHERE
    o.folioInterno = @folioOrden