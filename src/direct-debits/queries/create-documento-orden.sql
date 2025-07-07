INSERT INTO dbo.ordenDocumento 
  (idOrden, idDocumento, idPersonal, nombreArchivo, entregoFisico, observaciones, web, cancelado, tamanoArchivo, s3, s3Key, cargado, publicUrl)
VALUES (@idOrden, @idDocumento, 0, @nombreArchivo, 0, 'domiciliación automática', 0, 0, @tamanoArchivo, 1, @s3Key, 1, @publicUrl)