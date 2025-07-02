import { Injectable } from '@nestjs/common'
import { WebsocketGateway } from './websocket.gateway'

@Injectable()
export class WebsocketService {
  constructor(private readonly websocketGateway: WebsocketGateway) {}

  emitToClient(socketId: string, event: string, payload: any) {
    this.websocketGateway.emitToClient(socketId, event, payload)
  }
}
