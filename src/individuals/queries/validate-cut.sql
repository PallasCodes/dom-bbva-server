SELECT
	o.idOrden,
	o.idPersonaFisica,
	pf.fechaNacimiento,
	pf.idEntidadFederativaNacimiento,
	vsd.codigo,
	sm.folioOrden,
	sm.idSolicitudDom
FROM
	dbo.validacionSolicitudDom vsd WITH (NOLOCK)
	LEFT JOIN dbo.solicitudDomiciliacion sm WITH (NOLOCK) ON sm.idSolicitudDom = vsd.idSolicitudDom
	LEFT JOIN dbo.orden o WITH (NOLOCK) ON o.folioInterno = sm.folioOrden
	LEFT JOIN dbo.personaFisica pf WITH (NOLOCK) ON pf.idPersonaFisica = o.idPersonaFisica
WHERE
	pf.idPersonaFisica = @idPersonaFisica
	AND vsd.codigo = @codigo
	AND pf.fechaNacimiento = @fechaNacimiento
	AND pf.idEntidadFederativaNacimiento = @idEstadoNacimiento