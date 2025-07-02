INSERT INTO web.verificacionToku 
  (clabeIntroducida, rfcIntroducido, idEvento, status, idSolicitud, fromV3, procesoDom, idSocketIo)
VALUES (@clabeIntroducida, @rfcIntroducido, @idEvento, 'PROCESSING', @idSolicitud, 0, 1, @idSocketIo)