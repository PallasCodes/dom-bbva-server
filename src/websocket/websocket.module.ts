import { Module } from '@nestjs/common'
import { WebsocketService } from './websocket.service'
import { WebsocketGateway } from './websocket.gateway'

@Module({
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketService, WebsocketGateway]
})
export class WebsocketModule {}
