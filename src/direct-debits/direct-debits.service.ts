import * as fs from 'fs'
import * as path from 'path'

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

import { SqlService } from '../database/sql.service'
import { VerificacionToku } from '../types/verificacion-toku.interface'
import { TokuWebhookRequestDto } from './dto/toku-webhook-request.dto'
import { ValidateClabeDto } from './dto/validate-clabe.dto'
import { WebsocketService } from '../websocket/websocket.service'

@Injectable()
export class DirectDebitsService {
  TOKU_KEY
  private readonly updateProcessStep: string
  private readonly createVerificacionToku: string
  private readonly getVerificacionToku: string

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

  async getIndividualRfc(clabe: string) {
    return 'TOMB971024UW4'
  }

  async validateClabe({ clabe, idSocketIo }: ValidateClabeDto) {
    try {
      const rfc = await this.getIndividualRfc(clabe)

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

      // TODO: use real values
      await this.sqlService.query(this.createVerificacionToku, {
        clabeIntroducida: clabe,
        rfcIntroducido: rfc,
        idEvento: tokuResponse.data.id_bank_account_verification,
        idSolicitud: 1,
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

    // TODO: insert en tabla web.verificacionToku

    this.websocketService.emitToClient(
      verificacionToku.idSocketIo,
      'clabe_verification_result',
      {
        valid: verificacionToku.validacion === 'SUCCESS',
        message: 'La validación ha sido exitosa'
      }
    )

    console.log('websocket emitido')

    return { message: 'Proceso de validación finalizado' }
  }
}
