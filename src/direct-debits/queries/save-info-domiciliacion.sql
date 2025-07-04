IF EXISTS (
  SELECT 1
  FROM dbo.infoDomiciliacion WITH (NOLOCK)
  WHERE idSolicitudDomiciliacion = @idSolicitudDomiciliacion
)
BEGIN
  -- Si existe: actualiza
  UPDATE dbo.infoDomiciliacion
  SET 
    nombre1 = @nombre1,
    nombre2 = @nombre2,
    apellidoPaterno = @apellidoPaterno,
    apellidoMaterno = @apellidoMaterno,
    rfc = @rfc,
    curp = @curp,
    idNacionalidad = @idNacionalidad,
    idEstadoCivil = @idEstadoCivil,
    dependientes = @dependientes,
    sexo = @sexo,
    clabe = @clabe,
    urlFirma = @urlFirma
  WHERE idSolicitudDomiciliacion = @idSolicitudDomiciliacion
END
ELSE
BEGIN
  -- Si no existe: inserta
  INSERT INTO dbo.infoDomiciliacion (
    nombre1, nombre2, apellidoPaterno, apellidoMaterno,
    rfc, curp, idNacionalidad, idEstadoCivil, dependientes,
    sexo, clabe, urlFirma, idSolicitudDomiciliacion
  )
  VALUES (
    @nombre1, @nombre2, @apellidoPaterno, @apellidoMaterno,
    @rfc, @curp, @idNacionalidad, @idEstadoCivil, @dependientes,
    @sexo, @clabe, @urlFirma, @idSolicitudDomiciliacion
  )
END
