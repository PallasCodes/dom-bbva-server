UPDATE web.verificacionToku
SET 
  idWebhook = @idWebhook,
  pdfUrl = @pdfUrl,
  rfcIntroducido = @rfcIntroducido,
  clabeIntroducida = @clabeIntroducida,
  clabeReal = @clabeReal,
  rfcReal = @rfcReal,
  institucionBancaria = @institucionBancaria,
  nombreCompleto = @nombreCompleto,
  validacion = @validacion,
  status = @status
WHERE idEvento = @idEvento