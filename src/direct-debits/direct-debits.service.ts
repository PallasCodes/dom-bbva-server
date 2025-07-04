import * as fs from 'fs'
import * as path from 'path'

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

import { SqlService } from '../database/sql.service'
import { VerificacionToku } from '../types/verificacion-toku.interface'
import { WebsocketService } from '../websocket/websocket.service'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'

@Injectable()
export class DirectDebitsService {
  TOKU_KEY
  private readonly updateProcessStep: string
  private readonly createVerificacionToku: string
  private readonly getVerificacionToku: string
  private readonly updateVerificacionToku: string

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
}
