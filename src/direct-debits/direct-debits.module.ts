import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { SqlService } from '../database/sql.service'
import { DirectDebitsController } from './direct-debits.controller'
import { DirectDebitsService } from './direct-debits.service'
import { WebsocketModule } from '../websocket/websocket.module'
import { IndividualsModule } from '../individuals/individuals.module'

@Module({
  controllers: [DirectDebitsController],
  providers: [DirectDebitsService, SqlService],
  exports: [DirectDebitsService],
  imports: [
    ConfigModule.forRoot(),
    WebsocketModule,
    forwardRef(() => IndividualsModule) // 👈 importante
  ]
})
export class DirectDebitsModule {}
