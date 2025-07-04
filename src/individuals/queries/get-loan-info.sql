SELECT
	sc.folioInterno,
	sc.fechaFirma,
	sc.precioCapital AS prestamo,
	sc.precioPagare AS totalPagar,
	sc.idOrden,
	sc.saldoVirtual AS porPagar
FROM rep.snap_cobranza sc WITH (NOLOCK) 
WHERE sc.folioInterno = @folioOrden