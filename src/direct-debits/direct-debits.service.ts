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

import puppeteer from 'puppeteer'
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
  private readonly digitalSignature = 4202

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
      await this.s3.send(new PutObjectCommand(params))
      const publicUrl = `https://s3.amazonaws.com/${this.bucket}/${key}`

      const queryParams = {
        idOrden,
        publicUrl,
        idDocumento: this.digitalSignature,
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

  async getDirectDebitDocument(idOrden: number) {
    const [result] = await this.sqlService.query(
      `EXEC dbo.sp_jasper_domiciliacionBBVA @idOrden = ${idOrden}`
    )

    if (!result) {
      throw new NotFoundException('No se encontró la información de tu credito')
    }

    result.tokentarjeta01 = 1
    result.tokentarjeta02 = 3
    result.tokentarjeta03 = 3
    result.tokentarjeta04 = 3
    result.tokentarjeta05 = 3
    result.tokentarjeta06 = 3
    result.tokentarjeta07 = 3
    result.tokentarjeta08 = 3
    result.tokentarjeta09 = 3
    result.tokentarjeta10 = 3
    result.tokentarjeta11 = 3
    result.tokentarjeta12 = 3
    result.tokentarjeta13 = 3
    result.tokentarjeta14 = 3
    result.tokentarjeta15 = 3
    result.tokentarjeta16 = 3

    const periodicidadX = {
      SEMANAL: '70px',
      CATORCENAL: '177px',
      QUINCENAL: '284px',
      MENSUAL: '390px',
      BIMESTRAL: '497px',
      SEMESTRAL: '604px',
      ANUAL: '710px'
    }

    const periodicidadXPos = periodicidadX[(result.periodicidad as string).toUpperCase()]

    const imagePath = 'C:/Users/siste/Downloads/domicliacion_fimubac.jpg'
    const base64Image = fs.readFileSync(imagePath).toString('base64')
    const imageMimeType = 'image/jpeg'

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        p {
          position: fixed;
          color: #000000;
          font-weight: bold;
        }

        @page { size: letter; margin: 0; }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        body {
          background: url('data:${imageMimeType};base64,${base64Image}') no-repeat center center;
          background-size: cover;
        }
        .content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          color: white;
          font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="content">
        <p style="top: 157px; left: 76px;">GB PLUS S.A. DE C.V. SOFOM E.N.R.</p>
        <p style="top: 301px; left: 76px;">${result.banco}</p>

        <p style="top: 621px; left: 56px;">${result.deudor}</p>
        <p style="top: 476px; left: 490px;">${result.pagos}</p>

        <p style="top: 998px; left: 50px;">${result.deudor}</p>

        <div style="top: 570px; left: 480px; width: 160px; position: absolute;">
          <img style="width: 100%; height: auto;" src="${result.Firmadigitalizada}" />
        </div>

        <p style="top: 252px; left: ${periodicidadXPos};">X</p>

        <p style="top: 358px; left: 445px;">${result.tokentarjeta01}</p>
        <p style="top: 358px; left: 465px;">${result.tokentarjeta02}</p>
        <p style="top: 358px; left: 484px;">${result.tokentarjeta03}</p>
        <p style="top: 358px; left: 503px;">${result.tokentarjeta04}</p>

        <p style="top: 358px; left: 528px;">${result.tokentarjeta05}</p>
        <p style="top: 358px; left: 547px;">${result.tokentarjeta06}</p>
        <p style="top: 358px; left: 567px;">${result.tokentarjeta07}</p>
        <p style="top: 358px; left: 586px;">${result.tokentarjeta08}</p>

        <p style="top: 358px; left: 611px;">${result.tokentarjeta09}</p>
        <p style="top: 358px; left: 630px;">${result.tokentarjeta10}</p>
        <p style="top: 358px; left: 649px;">${result.tokentarjeta11}</p>
        <p style="top: 358px; left: 669px;">${result.tokentarjeta12}</p>

        <p style="top: 358px; left: 694px;">${result.tokentarjeta13}</p>
        <p style="top: 358px; left: 714px;">${result.tokentarjeta14}</p>
        <p style="top: 358px; left: 732px;">${result.tokentarjeta15}</p>
        <p style="top: 358px; left: 752px;">${result.tokentarjeta16}</p>

        <p style="top: 391px; left: 445px;">${result.tokenclabe01}</p>
        <p style="top: 391px; left: 465px;">${result.tokenclabe02}</p>
        <p style="top: 391px; left: 485px;">${result.tokenclabe03}</p>
        <p style="top: 391px; left: 504px;">${result.tokenclabe04}</p>
        <p style="top: 391px; left: 524px;">${result.tokenclabe05}</p>
        <p style="top: 391px; left: 542px;">${result.tokenclabe06}</p>
        <p style="top: 391px; left: 562px;">${result.tokenclabe07}</p>
        <p style="top: 391px; left: 582px;">${result.tokenclabe08}</p>
        <p style="top: 391px; left: 602px;">${result.tokenclabe09}</p>
        <p style="top: 391px; left: 622px;">${result.tokenclabe10}</p>
        <p style="top: 391px; left: 642px;">${result.tokenclabe11}</p>
        <p style="top: 391px; left: 661px;">${result.tokenclabe12}</p>
        <p style="top: 391px; left: 680px;">${result.tokenclabe13}</p>
        <p style="top: 391px; left: 699px;">${result.tokenclabe14}</p>
        <p style="top: 391px; left: 719px;">${result.tokenclabe15}</p>
        <p style="top: 391px; left: 739px;">${result.tokenclabe16}</p>
        <p style="top: 391px; left: 758px;">${result.tokenclabe17}</p>
        <p style="top: 391px; left: 778px;">${result.tokenclabe18}</p>

        <p style="top: 425px; left: 445px;">${result.tokentelefono01}</p>
        <p style="top: 425px; left: 465px;">${result.tokentelefono02}</p>
        <p style="top: 425px; left: 485px;">${result.tokentelefono03}</p>
        <p style="top: 425px; left: 504px;">${result.tokentelefono04}</p>
        <p style="top: 425px; left: 524px;">${result.tokentelefono05}</p>
        <p style="top: 425px; left: 542px;">${result.tokentelefono06}</p>
        <p style="top: 425px; left: 562px;">${result.tokentelefono07}</p>
        <p style="top: 425px; left: 582px;">${result.tokentelefono08}</p>
        <p style="top: 425px; left: 602px;">${result.tokentelefono09}</p>
        <p style="top: 425px; left: 622px;">${result.tokentelefono10}</p>

        <div style="top: 944px; left: 480px; width: 160px; position: absolute;">
          <img style="width: 100%; height: auto;" src="${result.Firmadigitalizada}" />
        </div>
      </div>
    </body>
    </html>
  `

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
}
