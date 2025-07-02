import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@WebSocketGateway()
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  emitToAll(event: string, payload: any) {
    this.server.emit(event, payload)
  }

  emitToClient(socketId: string, event: string, payload: any) {
    this.server.to(socketId).emit(event, payload)
  }
}
