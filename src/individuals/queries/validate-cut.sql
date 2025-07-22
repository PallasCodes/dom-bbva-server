SELECT
	pf.fechaNacimiento,
	pf.idEntidadFederativaNacimiento,
	vsd.codigo,
	sm.folioOrden,
	sm.idSolicitudDom,
	pf.idPersonaFisica
FROM
	dbo.validacionSolicitudDom vsd WITH (NOLOCK)
	LEFT JOIN dbo.solicitudDomiciliacion sm WITH (NOLOCK) ON sm.idSolicitudDom = vsd.idSolicitudDom
	LEFT JOIN dbo.personaFisica pf WITH (NOLOCK) ON pf.idPersonaFisica = sm.idPersonaFisica
WHERE
	pf.idPersonaFisica = @idPersonaFisica
	AND vsd.codigo = @codigo
	AND pf.fechaNacimiento = @fechaNacimiento
	AND pf.idEntidadFederativaNacimiento = @idEstadoNacimiento