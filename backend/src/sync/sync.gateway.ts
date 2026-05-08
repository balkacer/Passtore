import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';

type JwtPayload = { sub: string };

/**
 * Realtime fan-out for vault sync hints. Clients join room `user:<sub>` after JWT handshake.
 * Payload is opaque hints only — clients still pull `/sync/events`.
 */
@WebSocketGateway({
  namespace: '/sync',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SyncGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const raw =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : typeof client.handshake.query?.token === 'string'
          ? (client.handshake.query.token as string)
          : null;

    if (!raw) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(raw);
      const userId = payload.sub;
      client.data.userId = userId;
      await client.join(`user:${userId}`);
      this.logger.debug(`sync socket joined user:${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    /* noop */
  }

  notifyVaultChanged(
    userId: string,
    payload: { eventId?: string; reason?: string } = {},
  ) {
    this.server.to(`user:${userId}`).emit('vault:changed', payload);
  }
}
