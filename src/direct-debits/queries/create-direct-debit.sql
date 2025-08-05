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
  (@idPersonaFisica);

DECLARE @idSolicitudDom INT;

SET
  @idSolicitudDom = SCOPE_IDENTITY();

INSERT INTO
  dbo.validacionSolicitudDom(idSolicitudDom)
VALUES
  (idSolicitudDom);

END