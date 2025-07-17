SELECT solDom.folioOrden, solDom.idOrden, solDom.paso, solDom.idSolicitudDom, pf.rfc, od.publicUrl
FROM dbo.solicitudDomiciliacion solDom
WITH (NOLOCK)
    LEFT JOIN dbo.orden o
WITH (NOLOCK) ON o.idOrden = solDom.idOrden
    LEFT JOIN dbo.personaFisica pf
WITH (NOLOCK) ON pf.idPersonaFisica = o.idPersonaFisica
    LEFT JOIN dbo.ordenDocumento od
WITH (NOLOCK) ON od.idOrden = o.idOrden
    AND idDocumento = @idDocumento
WHERE
    solDom.folioOrden = @folioOrden