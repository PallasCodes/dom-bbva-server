import { Module } from '@nestjs/common'
import { SqlService } from '../database/sql.service'
import { DirectDebitsController } from './direct-debits.controller'
import { DirectDebitsService } from './direct-debits.service'

@Module({
  controllers: [DirectDebitsController],
  providers: [DirectDebitsService, SqlService],
  exports: [DirectDebitsService]
})
export class DirectDebitsModule {}
