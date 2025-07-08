export interface VerificacionToku {
  idVerificacionToku: number // PK, identity
  idWebhook?: string | null // varchar(255), nullable
  pdfUrl?: string | null // varchar(900), nullable
  rfcIntroducido: string // varchar(13), NOT NULL
  clabeIntroducida: string // varchar(20), NOT NULL
  fechaRegistro: Date // datetime, NOT NULL, default GETDATE()
  clabeReal?: string | null // varchar(20), nullable
  rfcReal?: string | null // varchar(13), nullable
  institucionBancaria?: string | null // varchar(255), nullable
  nombreCompleto?: string | null // varchar(255), nullable
  validacion?: string | null // varchar(255), nullable
  status?: string | null // varchar(255), nullable
  idEvento: string // varchar(255), NOT NULL
  idSolicitud?: number | null // FK, int, nullable
  fromV3?: boolean | null // bit, nullable
  procesoDom?: boolean | null // bit, nullable
  idSocketIo: string
  idOrden?: string
}
