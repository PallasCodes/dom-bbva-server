import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { EdicomModule } from 'src/edicom/edicom.module'
import { SqlService } from '../database/sql.service'
import { IndividualsModule } from '../individuals/individuals.module'
import { WebsocketModule } from '../websocket/websocket.module'
import { DirectDebitsController } from './direct-debits.controller'
import { DirectDebitsService } from './direct-debits.service'

@Module({
  controllers: [DirectDebitsController],
  providers: [DirectDebitsService, SqlService],
  exports: [DirectDebitsService],
  imports: [
    ConfigModule.forRoot(),
    WebsocketModule,
    EdicomModule,
    forwardRef(() => IndividualsModule)
  ]
})
export class DirectDebitsModule {}
