import * as fs from 'fs'
import * as path from 'path'

import { Injectable, UnauthorizedException } from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { ValidateCodeDto } from './dto/validate-code.dto'
import { DirectDebitsService } from 'src/direct-debits/direct-debits.service'

@Injectable()
export class IndividualsService {
  private readonly validateCut: string

  constructor(
    private readonly sqlService: SqlService,
    private readonly directDebitsService: DirectDebitsService
  ) {
    this.validateCut = fs.readFileSync(
      path.join(__dirname, 'queries', 'validate-cut.sql'),
      'utf8'
    )
  }

  async validateIndividual({
    folioOrden,
    codigo,
    idEstadoNacimiento,
    fechaNacimiento
  }: ValidateCodeDto) {
    const validData = await this.sqlService.query(this.validateCut, {
      folioOrden,
      codigo,
      idEstadoNacimiento,
      fechaNacimiento
    })

    if (!validData.length) {
      throw new UnauthorizedException('Folio o código CUT incorrecto')
    }

    await this.directDebitsService.updateStep(2, validData[0].idSolicitudDom)

    return { message: 'Validación CUT exitosa' }
  }
}
