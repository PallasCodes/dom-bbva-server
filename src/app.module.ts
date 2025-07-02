import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import databaseConfig from './config/database.config'
import { DirectDebitsModule } from './direct-debits/direct-debits.module'
import { IndividualsModule } from './individuals/individuals.module'
import { WebsocketModule } from './websocket/websocket.module'

@Module({
  imports: [
    IndividualsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }),
    DirectDebitsModule,
    WebsocketModule
  ]
})
export class AppModule {}
