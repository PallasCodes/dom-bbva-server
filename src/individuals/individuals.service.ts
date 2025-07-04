import * as fs from 'fs'
import * as path from 'path'

import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { ValidateCodeDto } from './dto/validate-code.dto'
import { DirectDebitsService } from 'src/direct-debits/direct-debits.service'

@Injectable()
export class IndividualsService {
  private readonly validateCut: string
  private readonly getIndividualInfo: string
  private readonly getBankInfo: string
  private readonly getLoanInfoQuery: string

  constructor(
    private readonly sqlService: SqlService,
    @Inject(forwardRef(() => DirectDebitsService))
    private readonly directDebitsService: DirectDebitsService
  ) {
    this.validateCut = fs.readFileSync(
      path.join(__dirname, 'queries', 'validate-cut.sql'),
      'utf8'
    )
    this.getIndividualInfo = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-individual-info.sql'),
      'utf8'
    )
    this.getBankInfo = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-bank-info.sql'),
      'utf8'
    )
    this.getLoanInfoQuery = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-loan-info.sql'),
      'utf8'
    )
  }

  async validateIndividual(dto: ValidateCodeDto) {
    const validData = await this.sqlService.query(this.validateCut, dto)

    if (!validData.length) {
      throw new UnauthorizedException('Folio o código CUT incorrecto')
    }

    await this.directDebitsService.updateStep(2, validData[0].idSolicitudDom)

    return { message: 'Validación CUT exitosa' }
  }

  async getIndividual(folioOrden: string) {
    const [individualInfo] = await this.sqlService.query(this.getIndividualInfo, {
      folioOrden
    })

    if (!individualInfo) {
      throw new NotFoundException('Cliente no encontrado')
    }

    return individualInfo
  }

  async getBank(folioOrden: string) {
    const individualInfo = await this.sqlService.query(this.getBankInfo, {
      folioOrden
    })

    return individualInfo
  }

  async getLoanInfo(folioOrden: string) {
    const [loanInfo] = await this.sqlService.query(this.getLoanInfoQuery, { folioOrden })

    if (!loanInfo) {
      throw new NotFoundException('No se encontró la información de tu folio')
    }

    return loanInfo
  }
}
