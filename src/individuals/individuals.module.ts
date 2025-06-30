import { Module } from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { IndividualsController } from './individuals.controller'
import { IndividualsService } from './individuals.service'
import { DirectDebitsService } from 'src/direct-debits/direct-debits.service'

@Module({
  controllers: [IndividualsController],
  providers: [IndividualsService, SqlService, DirectDebitsService]
})
export class IndividualsModule {}
