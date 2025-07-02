INSERT INTO web.verificacionToku 
  (clabeIntroducida, rfcIntroducido, idEvento, status, fromV3, procesoDom, idSocketIo)
VALUES (@clabeIntroducida, @rfcIntroducido, @idEvento, 'PROCESSING', 0, 1, @idSocketIo)