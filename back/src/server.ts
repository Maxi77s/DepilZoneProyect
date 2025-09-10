// src/server.ts
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import messageRoutes from "./routes/message.routes";
import roomRoutes from "./routes/room.routes";
import privateMessageRoutes from "./routes/privateMessage.routes";
import { PrivateMessage } from "./models/PrivateMessage";
import userRoutes from "./routes/user.routes";
import { User } from "./models/User";
import WaRouter from "./integration/whatsapp.router";
dotenv.config();

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());
app.set("trust proxy", 1); // si estás detrás de un proxy (ej. Heroku, Vercel, Nginx)
app.use(helmet());
app.use("/whatsapp", WaRouter);
// Rate limiting (solo auth; en dev queda desactivado)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

// Endpoint de prueba
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Rutas
app.use("/auth", authLimiter, authRoutes);
app.use("/messages", messageRoutes);
app.use("/rooms", roomRoutes);
app.use("/private-messages", privateMessageRoutes);
app.use("/users", userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN?.split(",") || "*" },
});



// Guardar `io` en app para usar en controladores
app.set("io", io);

// userId -> socketId
const connectedUsers = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("[SOCKET] connected:", socket.id);

  // Usuario se conecta (desde el cliente emiten user_connected)
  socket.on("user_connected", async (userId: string, ack?: Function) => {
    try {
      socket.data.userId = userId;
      connectedUsers.set(userId, socket.id);

      const upd = await User.updateOne(
        { _id: userId },
        { $set: { isConnected: true } }
      );
      console.log(
        "[SOCKET] user_connected -> DB set true",
        userId,
        "matched:",
        upd.matchedCount,
        "modified:",
        upd.modifiedCount
      );

      // Enviar lista de usuarios conectados (IDs)
      io.emit("users_online", Array.from(connectedUsers.keys()));

      // Mensajes no leídos
      const unread = await PrivateMessage.find({ to: userId, read: false });
      if (unread.length > 0) {
        socket.emit("unread_messages", unread);
        await PrivateMessage.updateMany(
          { to: userId, read: false },
          { $set: { read: true } }
        );
      }

      if (typeof ack === "function") ack({ ok: true });
    } catch (e) {
      console.error("[SOCKET] user_connected error", e);
      if (typeof ack === "function") ack({ ok: false });
    }
  });

  // Enviar mensaje Rooms
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`[SOCKET] ${socket.id} se unió a sala ${roomId}`);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    console.log(`[SOCKET] ${socket.id} salió de sala ${roomId}`);
  });

  // Enviar mensaje privado
  socket.on("private_message", async ({ to, text, clientId }) => {
    const from = socket.data.userId as string;
    if (!from) return;

    try {
      const saved = await PrivateMessage.create({ from, to, text });

      const payload = { ...saved.toObject(), clientId };

      // 🔎 Log para debug
      console.log("[SOCKET] 📥 Nuevo mensaje guardado en DB:", {
        _id: saved._id,
        from: saved.from,
        to: saved.to,
        text: saved.text,
        createdAt: saved.createdAt,
      });

      // enviar a destinatario
      const targetSocketId = connectedUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("private_message", payload);
      }

      // reenviar al remitente también
      socket.emit("private_message", payload);

      // marcar como leído si ya lo recibió
      if (targetSocketId) {
        await PrivateMessage.findByIdAndUpdate(saved._id, { read: true });
      }
    } catch (err) {
      console.error("[SOCKET] ❌ Error guardando mensaje:", err);
    }
  });

  // Logout manual (desde botón)
  socket.on("user_logout", async (userId: string, ack?: Function) => {
    try {
      connectedUsers.delete(userId);

      const upd = await User.updateOne(
        { _id: userId },
        { $set: { isConnected: false } }
      );
      console.log(
        "[SOCKET] user_logout -> DB set false",
        userId,
        "matched:",
        upd.matchedCount,
        "modified:",
        upd.modifiedCount
      );

      io.emit("users_online", Array.from(connectedUsers.keys()));
      io.emit("userDisconnected", userId);

      if (typeof ack === "function") ack({ ok: true });

      // opcional: cortar el socket del cliente que desloguea
      // socket.disconnect(true);
    } catch (e) {
      console.error("[SOCKET] user_logout error", e);
      if (typeof ack === "function") ack({ ok: false });
    }
  });

  // Desconexión (cierre pestaña, perder internet, etc.)
  socket.on("disconnect", async (reason) => {
    const userId = socket.data.userId as string | undefined;
    console.log(
      "[SOCKET] disconnect:",
      socket.id,
      "reason:",
      reason,
      "userId:",
      userId
    );

    if (userId) {
      connectedUsers.delete(userId);

      const upd = await User.updateOne(
        { _id: userId },
        { $set: { isConnected: false } }
      );
      console.log(
        "[SOCKET] disconnect -> DB set false",
        userId,
        "matched:",
        upd.matchedCount,
        "modified:",
        upd.modifiedCount
      );

      io.emit("users_online", Array.from(connectedUsers.keys()));
      io.emit("userDisconnected", userId);
    }
  });
});

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
});
