import { Module } from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { IndividualsController } from './individuals.controller'
import { IndividualsService } from './individuals.service'

@Module({
  controllers: [IndividualsController],
  providers: [IndividualsService, SqlService]
})
export class IndividualsModule {}
