import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(server: HttpServer): void {
    if (this.io) {
      console.warn("Socket.IO server already initialized");
      return;
    }

    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Allow joining a tenant-specific room for real-time isolation
      socket.on("join-tenant", (tenantId: string) => {
        socket.join(tenantId);
        console.log(`Socket ${socket.id} joined room: ${tenantId}`);
      });

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    console.log("Socket.IO service initialized successfully");
  }

  public emitToTenant(tenantId: string, event: string, data: any): void {
    if (!this.io) {
      console.error("Socket.IO server is not initialized yet");
      return;
    }
    this.io.to(tenantId).emit(event, data);
  }

  public emitGlobal(event: string, data: any): void {
    if (!this.io) {
      console.error("Socket.IO server is not initialized yet");
      return;
    }
    this.io.emit(event, data);
  }
}

export const socketService = SocketService.getInstance();
