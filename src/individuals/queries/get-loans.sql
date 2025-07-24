SELECT
    sc.folioInterno,
    sc.fechaFirma,
    sc.precioCapital AS prestamo,
    sc.precioPagare AS totalPagar,
    sc.idOrden,
    sc.saldoVirtual AS porPagar
FROM
    rep.snap_cobranza sc WITH (NOLOCK)
WHERE
    sc.idPersonaFisica = @idPersonaFisica
    AND sc.idEntidad IN (8, 50, 117, 197, 207)
    AND sc.idEstatusActual IN (2609, 2656, 2670, 2678, 2682, 2688);