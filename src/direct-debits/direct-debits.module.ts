import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { SqlService } from '../database/sql.service'
import { DirectDebitsController } from './direct-debits.controller'
import { DirectDebitsService } from './direct-debits.service'
import { WebsocketModule } from '../websocket/websocket.module'
import { WebsocketService } from 'src/websocket/websocket.service'

@Module({
  controllers: [DirectDebitsController],
  providers: [DirectDebitsService, SqlService, WebsocketService],
  exports: [DirectDebitsService],
  imports: [ConfigModule.forRoot(), WebsocketModule]
})
export class DirectDebitsModule {}
