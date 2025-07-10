SELECT COUNT(idOrden) AS numTries FROM dbo.intentoValidacionToku WITH (NOLOCK) 
WHERE idOrden = @idOrden AND tiempoCreacion >= DATEADD(HOUR, -24, GETDATE());