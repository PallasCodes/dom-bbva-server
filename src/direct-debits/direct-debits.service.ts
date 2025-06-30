import * as fs from 'fs'
import * as path from 'path'

import { Injectable } from '@nestjs/common'
import { SqlService } from 'src/database/sql.service'

@Injectable()
export class DirectDebitsService {
  private readonly updateProcessStep: string

  constructor(private readonly sqlService: SqlService) {
    this.updateProcessStep = fs.readFileSync(
      path.join(__dirname, 'queries', 'update-process-step.sql'),
      'utf8'
    )
  }

  async updateStep(step: number, idSolicitudDom: number) {
    const result = await this.sqlService.query(this.updateProcessStep, {
      step,
      idSolicitudDom
    })
    console.log('🚀 ~ DirectDebitsService ~ updateStep ~ result:', result)
  }
}
