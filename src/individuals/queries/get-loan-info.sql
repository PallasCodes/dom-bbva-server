SELECT
    sc.folioInterno,
    sc.fechaFirma,
    sc.precioCapital AS prestamo,
    sc.precioPagare AS totalPagar,
    sc.idOrden,
    sc.saldoVirtual AS porPagar,
    sd.idSolicitudDom
FROM rep.snap_cobranza sc
WITH (NOLOCK)
    LEFT JOIN dbo.solicitudDomiciliacion sd
WITH (NOLOCK) ON sd.folioOrden = sc.folioInterno
WHERE
    sc.folioInterno = @folioOrden