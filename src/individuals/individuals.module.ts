import { forwardRef, Module } from '@nestjs/common'

import { SqlService } from '../database/sql.service'
import { IndividualsController } from './individuals.controller'
import { IndividualsService } from './individuals.service'
import { WebsocketModule } from '../websocket/websocket.module'
import { DirectDebitsModule } from '../direct-debits/direct-debits.module'

@Module({
  controllers: [IndividualsController],
  providers: [IndividualsService, SqlService],
  imports: [
    WebsocketModule,
    forwardRef(() => DirectDebitsModule) // 👈 importante
  ],
  exports: [IndividualsService]
})
export class IndividualsModule {}
