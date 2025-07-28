IF NOT EXISTS (
  SELECT
    1
  FROM
    dbo.solicitudDomiciliacion WITH (NOLOCK)
  WHERE
    idPersonaFisica = @idPErsonaFisica
) BEGIN
INSERT
  dbo.solicitudDomiciliacion(idPersonaFisica)
VALUES
  (@idPersonaFisica)
END