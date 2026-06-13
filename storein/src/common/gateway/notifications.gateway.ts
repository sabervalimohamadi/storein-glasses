import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger }         from '@nestjs/common';
import { ConfigService }  from '@nestjs/config';
import { JwtService }     from '@nestjs/jwt';
import { InjectModel }    from '@nestjs/mongoose';
import { Model }          from 'mongoose';
import { User, UserDocument } from '../../modules/user/entities/user.schema';

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger  = new Logger(NotificationsGateway.name);
  private allowedOrigins: string[];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.allowedOrigins = this.configService.get<string[]>('app.allowedOrigins') ?? [];
  }

  afterInit(server: Server) {
    // Apply runtime origin check using configured allowedOrigins
    server.engine.on('headers', (_: unknown, req: any) => {
      const origin = req.headers?.origin as string | undefined;
      if (origin && !this.allowedOrigins.includes(origin)) {
        this.logger.warn(`WS rejected origin: ${origin}`);
      }
    });
    this.logger.log(`WebSocket Gateway /notifications initialized (origins: ${this.allowedOrigins.join(', ')})`);
  }

  async handleConnection(client: Socket) {
    const origin = client.handshake.headers?.origin as string | undefined;
    if (origin && !this.allowedOrigins.includes(origin)) {
      this.logger.warn(`WS connection rejected — origin not allowed: ${origin}`);
      client.disconnect();
      return;
    }
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization ?? '').replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token) as { sub: string };

      const user = await this.userModel
        .findById(payload.sub)
        .select('isAdmin role')
        .lean<UserDocument>();

      if (!user || (!user.isAdmin && user.role !== 'manager')) {
        client.disconnect();
        return;
      }

      client.join('admins');
      this.logger.log(`Admin connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitNewOrder(payload: {
    orderId:      string;
    orderNumber:  string;
    total:        number;
    customerName: string;
    createdAt:    string;
  }) {
    this.server.to('admins').emit('new_order', payload);
    this.logger.log(`Emitted new_order: ${payload.orderNumber}`);
  }

  emitNewReview(payload: {
    reviewId:    string;
    productName: string;
    rating:      number;
    userName:    string;
    createdAt:   string;
  }) {
    this.server.to('admins').emit('new_review', payload);
    this.logger.log(`Emitted new_review for: ${payload.productName}`);
  }
}
