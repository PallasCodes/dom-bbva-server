import { Module } from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { DirectDebitsService } from '../direct-debits/direct-debits.service'
import { WebsocketModule } from '../websocket/websocket.module'
import { IndividualsController } from './individuals.controller'
import { IndividualsService } from './individuals.service'

@Module({
  controllers: [IndividualsController],
  providers: [IndividualsService, SqlService, DirectDebitsService],
  imports: [WebsocketModule]
})
export class IndividualsModule {}
