SELECT
  pf.rfc,
  solDom.paso,
  solDom.idSolicitudDom,
  pf.idPersonaFisica
FROM
  dbo.solicitudDomiciliacion solDom WITH (NOLOCK)
  LEFT JOIN dbo.personaFisica pf WITH (NOLOCK) ON pf.idPersonaFisica = solDom.idPersonaFisica
WHERE
  pf.idPersonaFisica = @idPersonaFisica