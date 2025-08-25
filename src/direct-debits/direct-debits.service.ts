import * as fs from 'fs'
import * as path from 'path'

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  ObjectCannedACL,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import axios, { isAxiosError } from 'axios'
import puppeteer from 'puppeteer'

import { ValidateClabeError } from 'src/types/enums/validate-clabe-error.enum'
import { SqlService } from '../database/sql.service'
import { directDebitTemplate } from '../reports/direct-debit.report'
import { GenericResponseError } from '../types/enums/generic-response-error.enum'
import { VerificacionToku } from '../types/verificacion-toku.interface'
import { WebsocketService } from '../websocket/websocket.service'
import { SaveDirectDebitDto } from './dto/save-direct-debit.dto'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { UploadSignatureDto } from './dto/upload-signature-dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'
import { encrypt } from '../utils/crypto.util'
import { EdicomService } from 'src/edicom/edicom.service'

@Injectable()
export class DirectDebitsService {
  TOKU_KEY
  private readonly updateProcessStep: string
  private readonly createVerificacionToku: string
  private readonly getVerificacionToku: string
  private readonly updateVerificacionToku: string
  private readonly saveDirectDebit: string
  private readonly createDocumentoOrden: string
  private readonly getDirectDebit: string
  private readonly createValidationTry: string
  private readonly getNumTokuValidationTries: string
  private readonly signDirectDebit: string
  private readonly saveClabe: string
  private readonly saveSeal: string
  private readonly updatePublicUrlDom: string
  private readonly updateProcessStepByIdPersonaFisica: string
  private readonly getDirectDebitInfo: string
  private readonly saveSignatureUrl: string
  private readonly getDirectDebits: string
  private readonly createDirectDebitQuery: string
  private readonly registerFoliosDirectdebit: string

  private readonly digitalSignature = 4202
  private readonly directDebit: number

  private readonly s3: S3Client
  private readonly bucket: string
  private readonly logger = new Logger(DirectDebitsService.name)

  constructor(
    private configService: ConfigService,
    private readonly sqlService: SqlService,
    private readonly websocketService: WebsocketService,
    private readonly edicomService: EdicomService
  ) {
    this.directDebit = this.configService.get<string>('ENV') === 'dev' ? 4239 : 4251

    this.TOKU_KEY = this.configService.get<string>('TOKU_KEY')

    this.updateProcessStep = fs.readFileSync(
      path.join(__dirname, 'queries', 'update-process-step.sql'),
      'utf8'
    )

    this.saveSignatureUrl = fs.readFileSync(
      path.join(__dirname, 'queries', 'save-signature-url.sql'),
      'utf8'
    )

    this.getDirectDebits = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-direct-debits.sql'),
      'utf8'
    )

    this.getDirectDebitInfo = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-direct-debit-info.sql'),
      'utf8'
    )

    this.createVerificacionToku = fs.readFileSync(
      path.join(__dirname, 'queries', 'create-verificacion-toku.sql'),
      'utf8'
    )

    this.updateProcessStepByIdPersonaFisica = fs.readFileSync(
      path.join(__dirname, 'queries', 'update-step-by-id-persona-fisica.sql'),
      'utf8'
    )

    this.getVerificacionToku = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-verificacion-toku.sql'),
      'utf8'
    )

    this.saveDirectDebit = fs.readFileSync(
      path.join(__dirname, 'queries', 'save-info-domiciliacion.sql'),
      'utf8'
    )

    this.createDocumentoOrden = fs.readFileSync(
      path.join(__dirname, 'queries', 'create-documento-orden.sql'),
      'utf8'
    )

    this.updateVerificacionToku = fs.readFileSync(
      path.join(__dirname, 'queries', 'update-verificacion-toku.sql'),
      'utf8'
    )

    this.getDirectDebit = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-direct-debit.sql'),
      'utf8'
    )

    this.createValidationTry = fs.readFileSync(
      path.join(__dirname, 'queries', 'create-intento-validacion-toku.sql'),
      'utf8'
    )

    this.getNumTokuValidationTries = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-num-toku-validation-tries.sql'),
      'utf8'
    )

    this.signDirectDebit = fs.readFileSync(
      path.join(__dirname, 'queries', 'sign-direct-debit-doc.sql'),
      'utf8'
    )

    this.saveSeal = fs.readFileSync(
      path.join(__dirname, 'queries', 'save-seal.sql'),
      'utf8'
    )
    this.saveClabe = fs.readFileSync(
      path.join(__dirname, 'queries', 'save-info-domiciliacion-clabe.sql'),
      'utf8'
    )

    this.updatePublicUrlDom = fs.readFileSync(
      path.join(__dirname, 'queries', 'update-public-url-dom.sql'),
      'utf8'
    )

    this.createDirectDebitQuery = fs.readFileSync(
      path.join(__dirname, 'queries', 'create-direct-debit.sql'),
      'utf8'
    )

    this.registerFoliosDirectdebit = fs.readFileSync(
      path.join(__dirname, 'queries', 'register-folios-direct-debit.sql'),
      'utf8'
    )

    this.s3 = new S3Client({
      region: configService.get('AWS_REGION') as string,
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY') as string
      }
    })

    this.bucket = configService.get('AWS_S3_BUCKET') as string
  }

  async validateLoan(idPersonaFisica: number) {
    const ordenesResult = await this.sqlService.query(this.getDirectDebits, {
      idPersonaFisica,
      idDocumento: this.directDebit
    })

    await this.sqlService.query(this.registerFoliosDirectdebit, {
      idPersonaFisica,
      folios: ordenesResult.map((o) => o.folioInterno).join(',')
    })

    await this.updateStepByIdPersonaFisica(2, idPersonaFisica)

    return { ok: true }
  }

  async getDirectDebitByIdPersonaFisica(idPersonaFisica: number) {
    const [result] = await this.sqlService.query(this.getDirectDebitInfo, {
      idPersonaFisica
    })

    if (!result) throw new NotFoundException('Crédito no encontrado')

    return result
  }

  async getDirectDebitByIdOrden(idOrden: number) {
    const [result] = await this.sqlService.query(this.getDirectDebit, { idOrden })

    if (!result) throw new NotFoundException('Crédito no encontrado')

    return result
  }

  async save(dto: SaveDirectDebitDto) {
    try {
      await this.sqlService.query(this.saveDirectDebit, dto)
      await this.updateStep(3, dto.idSolicitudDomiciliacion)

      return { message: 'Información guardada' }
    } catch (err) {
      throw new InternalServerErrorException('Ocurrió un error al guardar tu información')
    }
  }

  async updateStep(step: number, idSolicitudDom: number) {
    await this.sqlService.query(this.updateProcessStep, {
      step,
      idSolicitudDom
    })

    return { message: 'OK' }
  }

  async updateStepByIdPersonaFisica(step: number, idPersonaFisica: number) {
    await this.sqlService.query(this.updateProcessStepByIdPersonaFisica, {
      step,
      idPersonaFisica
    })

    return { message: 'OK' }
  }

  async validateClabe({ clabe, idSocketIo, rfc, idPersonaFisica }: ValidateClabeDto) {
    try {
      const numTries = await this.getValidationTries(idPersonaFisica)
      if (numTries >= 3) this.throwLimitReached()

      await this.sqlService.query(this.createValidationTry, { idPersonaFisica })

      const verificationId = await this.verifyClabeWithToku(clabe, rfc, numTries)

      await this.sqlService.query(this.createVerificacionToku, {
        clabeIntroducida: clabe,
        rfcIntroducido: rfc,
        idEvento: verificationId,
        idSocketIo,
        idPersonaFisica
      })

      return {
        message: 'Proceso de validación iniciado',
        numTries: numTries + 1
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error

      this.logger.error('Unexpected error:', error)
      throw new InternalServerErrorException(
        'Ocurrió un error al validar tu cuenta, inténtalo más tarde'
      )
    }
  }

  private async getValidationTries(idPersonaFisica: number): Promise<number> {
    const [result] = await this.sqlService.query(this.getNumTokuValidationTries, {
      idPersonaFisica
    })
    return result?.numTries || 0
  }

  private throwLimitReached() {
    throw new BadRequestException({
      code: ValidateClabeError.VALIDATION_TRIES_LIMIT_REACHED,
      message: 'Has excedido el límite de intentos de validación, inténtalo en 24 hrs'
    })
  }

  private async verifyClabeWithToku(
    clabe: string,
    rfc: string,
    numTries: number
  ): Promise<string> {
    try {
      const { data } = await axios.post(
        'https://api.trytoku.com/bank-account-verification',
        { account_number: clabe, customer_identifier: rfc },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-api-key': this.TOKU_KEY
          },
          timeout: 5000
        }
      )

      if (!data || data.message !== 'OK' || !data.id_bank_account_verification) {
        if (numTries + 1 >= 3) this.throwLimitReached()

        throw new BadRequestException({
          code: ValidateClabeError.INVALID_CLABE_OR_RFC,
          message: `La cuenta CLABE o el RFC no son válidos. Intento ${numTries + 1} de 3`
        })
      }

      return data.id_bank_account_verification
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.data?.error === 'Invalid CLABE') {
          if (numTries + 1 >= 3) this.throwLimitReached()

          throw new BadRequestException({
            code: ValidateClabeError.INVALID_CLABE,
            message: `La cuenta CLABE no es válida. Intento ${numTries + 1} de 3`
          })
        }

        throw new BadRequestException({
          code: GenericResponseError.THIRD_PARTY_ERROR,
          message: 'Error al validar la cuenta con el proveedor externo'
        })
      }

      throw error
    }
  }

  async handleTokuWebhook(dto: TokuWebhookRequestDto) {
    const [verificacionToku] = await this.sqlService.query<VerificacionToku>(
      this.getVerificacionToku,
      {
        idEvento: dto.bank_account_verification.id_bank_account_verification
      }
    )

    if (!verificacionToku) {
      throw new NotFoundException('Evento toku no encontrado')
    }

    if (!verificacionToku.procesoDom) return

    const { bank_account_verification: toku } = dto
    const { voucher_information: voucher } = toku

    const verificacionTokuPayload: Partial<VerificacionToku> = {
      idWebhook: dto.id,
      pdfUrl: toku.voucher_url.pdf,
      rfcIntroducido: toku.customer_identifier,
      clabeIntroducida: toku.account_number,
      clabeReal: voucher.account_number,
      rfcReal: voucher.customer_identifier,
      institucionBancaria: voucher.receiver_name,
      nombreCompleto: voucher.receiver_institution,
      validacion: toku.validation,
      status: toku.status,
      idEvento: toku.id_bank_account_verification
    }

    await this.sqlService.query(this.updateVerificacionToku, verificacionTokuPayload)

    const eventPayload = {
      valid: dto.bank_account_verification.validation === 'SUCCESS',
      message:
        dto.bank_account_verification.validation === 'SUCCESS'
          ? 'La validación ha sido exitosa'
          : 'La CLABE no coincide con tu RFC'
    }

    this.logger.log(
      `Toku event: ${dto.bank_account_verification.id_bank_account_verification}`
    )

    if (eventPayload.valid) {
      this.sqlService.query(this.saveClabe, {
        clabe: verificacionToku.clabeIntroducida,
        idPersonaFisica: verificacionToku.idPersonaFisica,
        idTipo: 21002, // domiliciacion
        idBanco: 3 // bbva
      })
    }

    this.websocketService.emitToClient(
      verificacionToku.idSocketIo,
      'clabe_verification_result',
      eventPayload
    )

    return { message: 'Proceso de validación finalizado' }
  }

  async generateDirectDebitPdf({
    idOrden,
    latitude,
    longitude,
    idPersonaFisica
  }: {
    idOrden: number
    latitude: number
    longitude: number
    idPersonaFisica
  }): Promise<string> {
    try {
      const pdfBuffer = await this.getDirectDebitDocument({
        idOrden,
        latitude,
        longitude,
        idPersonaFisica
      })

      const codeName = `${idOrden}.${this.directDebit}`
      const fileName = `${codeName}.${new Date().getTime()}.pdf`
      const key = `${new Date().getFullYear()}/${idOrden}/${fileName}`

      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ACL: ObjectCannedACL.public_read
      }

      const pdfUrl = await this.uploadFileToS3(params)

      return pdfUrl
    } catch (error) {
      this.logger.error('Error uploading file to S3', error)
      throw new InternalServerErrorException('Error al guardar archivo')
    }
  }

  async uploadFileToS3(params: PutObjectCommandInput) {
    try {
      await this.s3.send(new PutObjectCommand(params))
      return `https://s3.amazonaws.com/${this.bucket}/${params.Key}`
    } catch (error) {
      this.logger.error('Error uploading file to S3', error)
      throw new InternalServerErrorException('Error al guardar archivo')
    }
  }

  createDirectDebit(idPersonaFisica: number) {
    return this.sqlService.query(this.createDirectDebitQuery, { idPersonaFisica })
  }

  async uploadSignature(
    file: Express.Multer.File,
    { latitude, longitude, idPersonaFisica }: UploadSignatureDto
  ) {
    const codeName = `${idPersonaFisica}.${this.digitalSignature}`
    const fileName = `${codeName}.${new Date().getTime()}.png`
    const key = `${new Date().getFullYear()}/personaFisica/${idPersonaFisica}/${fileName}`
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: ObjectCannedACL.public_read
    }

    try {
      const publicUrl = await this.uploadFileToS3(params)

      const queryParams = {
        idPersonaFisica,
        publicUrl
      }
      await this.sqlService.query(this.saveSignatureUrl, queryParams)

      const ordenesResult = await this.sqlService.query(this.getDirectDebits, {
        idPersonaFisica,
        idDocumento: this.directDebit
      })

      const promises = ordenesResult.map(({ idOrden }) => {
        return new Promise(async (accept) => {
          const pdfUrl = await this.generateDirectDebitPdf({
            idOrden,
            latitude: +latitude,
            longitude: +longitude,
            idPersonaFisica
          })

          const codeNameDom = `${idOrden}.${this.directDebit}`
          const fileNameDom = `${codeNameDom}.${new Date().getTime()}.pdf`
          const keyDom = `${new Date().getFullYear()}/${idOrden}/${fileNameDom}`

          const queryParamsDom = {
            idOrden,
            publicUrl: pdfUrl,
            idDocumento: this.directDebit,
            nombreArchivo: fileNameDom,
            tamanoArchivo: 0,
            s3Key: keyDom
          }
          await this.sqlService.query(this.createDocumentoOrden, queryParamsDom)

          accept(pdfUrl)
        })
      })

      const pdfUrls = await Promise.all(promises)

      await this.updateStepByIdPersonaFisica(4, idPersonaFisica)

      return { message: 'Firma digital guardada correctamente', pdfUrls }
    } catch (error) {
      this.logger.error('Error uploading file to S3', error)
      throw new InternalServerErrorException('Error al guardar la firma digital')
    }
  }

  async getDirectDebitDocument({
    idOrden,
    latitude,
    longitude,
    idPersonaFisica
  }: {
    idOrden: number
    latitude: number
    longitude: number
    idPersonaFisica: number
  }): Promise<Uint8Array<ArrayBufferLike>> {
    const [result] = await this.sqlService.query(
      `EXEC dbo.sp_jasper_domiciliacionBBVA @idOrden = ${idOrden}`
    )

    if (!result) {
      throw new NotFoundException('No se encontró la información de tu credito')
    }

    const selloClear = `idOrden=${idOrden}|geoLatitud=${latitude}|geoLongitud=${longitude}`
    result.encryptedSeal = encrypt(selloClear)
    result.showTimeStamp = false

    await this.sqlService.query(this.saveSeal, {
      idPersonaFisica,
      selloClear,
      sello: result.encryptedSeal
    })

    return this.generateDebitDocument(result)
  }

  private async generateDebitDocument(result: any) {
    try {
      const html = directDebitTemplate(result)
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'letter',
        printBackground: true,
        margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' }
      })

      await browser.close()
      return pdfBuffer
    } catch (err) {
      throw err
    }
  }

  async signDirectDebitDoc(idPersonaFisica: number) {
    try {
      const ordenesResult = await this.sqlService.query(this.getDirectDebits, {
        idPersonaFisica,
        idDocumento: this.directDebit
      })
      const ordenes = ordenesResult.map((res) => res.idOrden)

      await this.sqlService.query(this.signDirectDebit, { idPersonaFisica })
      await this.updateStepByIdPersonaFisica(5, idPersonaFisica)

      const promises = ordenes.map((idOrden) => {
        return new Promise(async (accept) => {
          const [result] = await this.sqlService.query(
            `EXEC dbo.sp_jasper_domiciliacionBBVA @idOrden = ${idOrden}`
          )

          if (!result) {
            throw new NotFoundException('No se encontró la información de tu credito')
          }
          result.showTimeStamp = true
          const pdfBuffer = await this.generateDebitDocument(result)

          const codeName = `${idOrden}.${this.directDebit}`
          const fileName = `${codeName}.${new Date().getTime()}.pdf`
          const key = `${new Date().getFullYear()}/${idOrden}/${fileName}`

          const params: PutObjectCommandInput = {
            Bucket: this.bucket,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: ObjectCannedACL.public_read
          }

          const pdfUrl = await this.uploadFileToS3(params)

          await this.sqlService.query(this.updatePublicUrlDom, {
            idDocumento: this.directDebit,
            idOrden,
            publicUrl: pdfUrl,
            s3Key: key
          })

          const bufferFile = Buffer.from(pdfBuffer)

          const uploadEdicomDocPayload = {
            idOrden,
            file: bufferFile,
            documentName: idOrden.toString(),
            documentTitle: `${idOrden}-domiciliacion.pdf`,
            tags: idOrden.toString()
          }

          const UUID = await this.edicomService.uploadFile(uploadEdicomDocPayload)

          const saveEdicomDocPayload = {
            idOrden: uploadEdicomDocPayload.idOrden,
            documentName: uploadEdicomDocPayload.documentName,
            documentTitle: uploadEdicomDocPayload.documentTitle,
            folder: uploadEdicomDocPayload.idOrden.toString(),
            tags: uploadEdicomDocPayload.idOrden.toString(),
            UUID
          }
          await this.edicomService.saveEdicomDoc(saveEdicomDocPayload)

          accept(pdfUrl)
        })
      })

      const pdfUrls = await Promise.all(promises)

      return { message: 'Documento firmado', pdfUrls }
    } catch (err) {
      throw new InternalServerErrorException('Ocurrió un error al firmar el documento')
    }
  }
}
