import * as fs from 'fs'
import * as path from 'path'

import { Injectable } from '@nestjs/common'
import { SqlService } from '../database/sql.service'

@Injectable()
export class IndividualsService {
  private readonly getCLients: string

  constructor(private readonly sqlService: SqlService) {
    this.getCLients = fs.readFileSync(
      path.join(__dirname, 'queries', 'get-individuals.sql'),
      'utf8'
    )
  }

  async getClient() {
    const results = await this.sqlService.query(this.getCLients)

    return results
  }
}
