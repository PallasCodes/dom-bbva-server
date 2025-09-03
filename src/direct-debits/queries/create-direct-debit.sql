IF EXISTS (
  SELECT
    1
  FROM
    dbo.solicitudDomiciliacion WITH (NOLOCK)
  WHERE
    idPersonaFisica = @idPersonaFisica
) BEGIN
UPDATE
  solDom
SET
  solDom.tiempoEnvioSms = GETDATE(),
  solDom.idUsuarioEnvioSms = @idUsuarioV3
FROM
  dbo.solicitudDomiciliacion solDom
WHERE
  solDom.idPersonaFisica = @idPersonaFisica;

END
ELSE BEGIN
INSERT INTO
  dbo.solicitudDomiciliacion (idPersonaFisica, idUsuarioEnvioSms)
VALUES
  (@idPersonaFisica, @idUsuarioV3);

DECLARE @idSolicitudDom INT;

SET
  @idSolicitudDom = SCOPE_IDENTITY();

INSERT INTO
  dbo.validacionSolicitudDom (idSolicitudDom)
VALUES
  (@idSolicitudDom);

END