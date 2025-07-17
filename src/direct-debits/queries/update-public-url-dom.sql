UPDATE dbo.ordenDocumento
SET
    publicUrl = @publicUrl,
    s3Key = @s3Key
WHERE
    idOrden = @idOrden
    AND idDocumento = @idDocumento