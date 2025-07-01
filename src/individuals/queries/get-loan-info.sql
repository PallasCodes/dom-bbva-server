SELECT
	o.folioInterno,
	o.fechaFirma,
	o.capital AS prestamo,
	o.pagare AS totalPagar,
	o.idOrden
FROM dbo.orden o WITH (NOLOCK)
WHERE o.folioInterno = @folioOrden