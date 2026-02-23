import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { sdk } from "./sdk";

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, restrict this to your domain
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const payload = await sdk.verifySessionToken(token);
      if (!payload || !payload.openId) {
        return next(new Error("Invalid token"));
      }

      // Attach user info to socket
      socket.data.openId = payload.openId;
      socket.data.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`[WebSocket] User ${userId} connected`);

    // Join user's personal room (for DMs and notifications)
    socket.join(`user:${userId}`);

    // Handle joining a channel
    socket.on("join-channel", (channelId: number) => {
      socket.join(`channel:${channelId}`);
      console.log(`[WebSocket] User ${userId} joined channel ${channelId}`);
    });

    // Handle leaving a channel
    socket.on("leave-channel", (channelId: number) => {
      socket.leave(`channel:${channelId}`);
      console.log(`[WebSocket] User ${userId} left channel ${channelId}`);
    });

    // Handle typing indicator
    socket.on("typing-start", (channelId: number) => {
      socket.to(`channel:${channelId}`).emit("user-typing", {
        channelId,
        userId,
      });
    });

    socket.on("typing-stop", (channelId: number) => {
      socket.to(`channel:${channelId}`).emit("user-stopped-typing", {
        channelId,
        userId,
      });
    });

    // Handle presence updates
    socket.on("presence-update", (status: "online" | "away" | "offline") => {
      // Broadcast to all users who share channels with this user
      socket.broadcast.emit("user-presence-changed", {
        userId,
        status,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[WebSocket] User ${userId} disconnected`);
      // Broadcast offline status
      socket.broadcast.emit("user-presence-changed", {
        userId,
        status: "offline",
      });
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
}

// Helper functions to emit events from backend
export function emitNewMessage(channelId: number, message: any) {
  if (io) {
    io.to(`channel:${channelId}`).emit("new-message", message);
  }
}

export function emitMessageReaction(channelId: number, data: any) {
  if (io) {
    io.to(`channel:${channelId}`).emit("message-reaction", data);
  }
}

export function emitMessageDeleted(channelId: number, messageId: number) {
  if (io) {
    io.to(`channel:${channelId}`).emit("message-deleted", { messageId });
  }
}

export function emitChannelUpdated(channelId: number, updates: any) {
  if (io) {
    io.to(`channel:${channelId}`).emit("channel-updated", updates);
  }
}

export function emitUserJoinedChannel(channelId: number, user: any) {
  if (io) {
    io.to(`channel:${channelId}`).emit("user-joined", user);
  }
}

export function emitUserLeftChannel(channelId: number, userId: number) {
  if (io) {
    io.to(`channel:${channelId}`).emit("user-left", { userId });
  }
}
