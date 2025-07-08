IF EXISTS (
    SELECT 1 FROM dbo.ordenDocumento 
    WHERE idOrden = @idOrden AND idDocumento = @idDocumento
)
BEGIN
    UPDATE dbo.ordenDocumento
    SET 
        tamanoArchivo = @tamanoArchivo,
        nombreArchivo = @nombreArchivo,
        s3Key = @s3Key,
        publicUrl = @publicUrl
    WHERE idOrden = @idOrden AND idDocumento = @idDocumento;
END
ELSE
BEGIN
    INSERT INTO dbo.ordenDocumento 
      (idOrden, idDocumento, idPersonal, nombreArchivo, entregoFisico, observaciones, web, cancelado, tamanoArchivo, s3, s3Key, cargado, publicUrl)
    VALUES 
      (@idOrden, @idDocumento, 0, @nombreArchivo, 0, 'domiciliación automática', 0, 0, @tamanoArchivo, 1, @s3Key, 1, @publicUrl);
END
