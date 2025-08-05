UPDATE
  vsd
SET
  codigo = @cut
FROM
  dbo.validacionSolicitudDom vsd
  LEFT JOIN dbo.solicitudDomiciliacion sd ON vsd.idSolicitudDom = sd.idSolicitudDom
WHERE
  sd.idPersonaFisica = @idPersonaFisica