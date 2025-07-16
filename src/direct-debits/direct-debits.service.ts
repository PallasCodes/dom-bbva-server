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
import { encrypt } from 'src/utils/crypto.util'

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
  private readonly saveSeal: string

  private readonly digitalSignature = 4202
  private readonly directDebit: number

  private readonly s3: S3Client
  private readonly bucket: string
  private readonly logger = new Logger(DirectDebitsService.name)

  constructor(
    private configService: ConfigService,
    private readonly sqlService: SqlService,
    private readonly websocketService: WebsocketService
  ) {
    this.directDebit = this.configService.get<string>('ENV') === 'dev' ? 4239 : 4251

    this.TOKU_KEY = this.configService.get<string>('TOKU_KEY')

    this.updateProcessStep = fs.readFileSync(
      path.join(__dirname, 'queries', 'update-process-step.sql'),
      'utf8'
    )

    this.createVerificacionToku = fs.readFileSync(
      path.join(__dirname, 'queries', 'create-verificacion-toku.sql'),
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

    this.s3 = new S3Client({
      region: configService.get('AWS_REGION') as string,
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY') as string
      }
    })

    this.bucket = configService.get('AWS_S3_BUCKET') as string
  }

  async getDirectDebitByIdOrden(idOrden: number) {
    const [result] = await this.sqlService.query(this.getDirectDebit, { idOrden })

    if (!result) throw new NotFoundException('Crédito no encontrado')

    return result
  }

  async save(dto: SaveDirectDebitDto) {
    try {
      await this.sqlService.query(this.saveDirectDebit, dto)

      return { message: 'Información guardada' }
    } catch (err) {
      throw new InternalServerErrorException('Ocurrió un error al guardar tu información')
    }
  }

  updateStep(step: number, idSolicitudDom: number) {
    this.sqlService.query(this.updateProcessStep, {
      step,
      idSolicitudDom
    })
  }

  async validateClabe({ clabe, idSocketIo, rfc, idOrden }: ValidateClabeDto) {
    try {
      const numTries = await this.getValidationTries(idOrden)
      if (numTries >= 3) this.throwLimitReached()

      await this.sqlService.query(this.createValidationTry, { idOrden })

      const verificationId = await this.verifyClabeWithToku(clabe, rfc, numTries)

      await this.sqlService.query(this.createVerificacionToku, {
        clabeIntroducida: clabe,
        rfcIntroducido: rfc,
        idEvento: verificationId,
        idSocketIo,
        idOrden
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

  private async getValidationTries(idOrden: number): Promise<number> {
    const [result] = await this.sqlService.query(this.getNumTokuValidationTries, {
      idOrden
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
    longitude
  }: UploadSignatureDto): Promise<string> {
    try {
      const pdfBuffer = await this.getDirectDebitDocument({
        idOrden: Number(idOrden),
        latitude,
        longitude
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

  async uploadSignature(
    file: Express.Multer.File,
    { idOrden, latitude, longitude }: UploadSignatureDto
  ) {
    const codeName = `${idOrden}.${this.digitalSignature}`
    const extension = path.extname(file.originalname)
    const fileName = `${codeName}.${new Date().getTime()}${extension}`
    const key = `${new Date().getFullYear()}/${idOrden}/${fileName}`
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
        idOrden,
        publicUrl,
        idDocumento: this.digitalSignature,
        nombreArchivo: fileName,
        tamanoArchivo: file.size,
        s3Key: key
      }
      await this.sqlService.query(this.createDocumentoOrden, queryParams)

      const pdfUrl = await this.generateDirectDebitPdf({ idOrden, latitude, longitude })

      return { message: 'Firma digital guardada correctamente', pdfUrl }
    } catch (error) {
      this.logger.error('Error uploading file to S3', error)
      throw new InternalServerErrorException('Error al guardar la firma digital')
    }
  }

  async getDirectDebitDocument({
    idOrden,
    latitude,
    longitude
  }: UploadSignatureDto): Promise<Uint8Array<ArrayBufferLike>> {
    const [result] = await this.sqlService.query(
      `EXEC dbo.sp_jasper_domiciliacionBBVA @idOrden = ${idOrden}`
    )

    if (!result) {
      throw new NotFoundException('No se encontró la información de tu credito')
    }

    const selloClear = `idOrden=${idOrden}|geoLatitud=${latitude}|geoLongitud=${longitude}`
    result.encryptedSeal = encrypt(selloClear)

    await this.sqlService.query(this.saveSeal, {
      idOrden,
      selloClear,
      sello: result.encryptedSeal
    })

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
  }

  async signDirectDebitDoc(idOrden: number) {
    await this.getDirectDebitByIdOrden(idOrden)

    await this.sqlService.query(this.signDirectDebit, { idOrden })

    return { message: 'Documento firmado' }
    // TODO: subir a edicom
  }
}
