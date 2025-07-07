import * as fs from 'fs'
import * as path from 'path'

import { ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

import { SqlService } from '../database/sql.service'
import { VerificacionToku } from '../types/verificacion-toku.interface'
import { WebsocketService } from '../websocket/websocket.service'
import { SaveDirectDebitDto } from './dto/save-direct-debit.dto'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { UploadSignatureDto } from './dto/upload-signature-dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'

@Injectable()
export class DirectDebitsService {
  TOKU_KEY
  private readonly updateProcessStep: string
  private readonly createVerificacionToku: string
  private readonly getVerificacionToku: string
  private readonly updateVerificacionToku: string
  private readonly saveDirectDebit: string
  private readonly createDocumentoOrden: string

  private readonly s3: S3Client
  private readonly bucket: string
  private readonly logger = new Logger(DirectDebitsService.name)

  constructor(
    private configService: ConfigService,
    private readonly sqlService: SqlService,
    private readonly websocketService: WebsocketService
  ) {
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

    this.s3 = new S3Client({
      region: configService.get('AWS_REGION') as string,
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY') as string
      }
    })

    this.bucket = configService.get('AWS_S3_BUCKET') as string
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

  async validateClabe({ clabe, idSocketIo, rfc }: ValidateClabeDto) {
    try {
      const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': this.TOKU_KEY
      }
      const body = {
        account_number: clabe,
        customer_identifier: rfc
      }

      const tokuResponse = await axios.post(
        'https://api.trytoku.com/bank-account-verification',
        body,
        { headers }
      )

      if (!tokuResponse.data) {
        throw new BadRequestException(
          'Ocurrió un error al validar tu cuenta, inténtalo más tarde'
        )
      }
      if (tokuResponse.data.error === 'Invalid CLABE') {
        throw new BadRequestException('La cuenta CLABE no es válida')
      }
      if (
        tokuResponse.data.error ||
        tokuResponse.data.message !== 'OK' ||
        !tokuResponse.data.id_bank_account_verification
      ) {
        throw new BadRequestException('La cuenta CLABE o el RFC no son válidos')
      }

      await this.sqlService.query(this.createVerificacionToku, {
        clabeIntroducida: clabe,
        rfcIntroducido: rfc,
        idEvento: tokuResponse.data.id_bank_account_verification,
        idSocketIo
      })

      return { message: 'Proceso de validación iniciado' }
    } catch (error) {
      if (error.response.data.error === 'Invalid CLABE') {
        throw new BadRequestException('La cuenta CLABE no es válida')
      }
      throw new BadRequestException(
        'Ocurrió un error al validar tu cuenta, inténtalo más tarde'
      )
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
      valid: verificacionToku.validacion === 'SUCCESS',
      message:
        verificacionToku.validacion === 'SUCCESS'
          ? 'La validación ha sido exitosa'
          : 'La CLABE no coincide con tu RFC'
    }

    this.websocketService.emitToClient(
      verificacionToku.idSocketIo,
      'clabe_verification_result',
      eventPayload
    )

    return { message: 'Proceso de validación finalizado' }
  }

  async uploadSignature(file: Express.Multer.File, { idOrden }: UploadSignatureDto) {
    const codeName = `${idOrden}.4251`
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
      await this.s3.send(new PutObjectCommand(params))
      const publicUrl = `https://s3.amazonaws.com/${this.bucket}/${key}`

      const queryParams = {
        idOrden,
        publicUrl,
        idDocumento: 4251,
        nombreArchivo: fileName,
        tamanoArchivo: file.size,
        s3Key: key
      }
      await this.sqlService.query(this.createDocumentoOrden, queryParams)

      return { message: 'Firma digital guardada correctamente' }
    } catch (error) {
      this.logger.error('Error uploading file to S3', error)
      throw new InternalServerErrorException('Error al guardar la firma digital')
    }
  }
}
