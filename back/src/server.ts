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

dotenv.config();

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // límite de requests
});
app.use(limiter);

// Endpoint de prueba
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Rutas
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/rooms", roomRoutes);
app.use("/private-messages", privateMessageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN?.split(",") || "*" },
});

// Guardar `io` en app para usar en controladores
app.set("io", io);

const connectedUsers = new Map<string, string>(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  socket.on("user_connected", async (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.data.userId = userId;
    io.emit("users_online", Array.from(connectedUsers.keys()));

    // 🔹 Buscar mensajes no leídos y enviarlos
    const unreadMessages = await PrivateMessage.find({
      to: userId,
      read: false,
    });
    if (unreadMessages.length > 0) {
      socket.emit("unread_messages", unreadMessages);

      // Marcarlos como leídos
      await PrivateMessage.updateMany(
        { to: userId, read: false },
        { $set: { read: true } }
      );
    }
  });

  // 🔹 Enviar mensaje privado
  socket.on("private_message", async ({ to, text }) => {
    const from = socket.data.userId;
    if (!from) return;

    // Guardar en la DB
    const savedMessage = await PrivateMessage.create({ from, to, text });

    const targetSocketId = connectedUsers.get(to);
    if (targetSocketId) {
      // Si está online, se lo enviamos en tiempo real
      io.to(targetSocketId).emit("private_message", savedMessage);

      // Marcamos como leído
      await PrivateMessage.findByIdAndUpdate(savedMessage._id, { read: true });
    }
  });

  // 🔹 Desconexión
  socket.on("disconnect", () => {
    for (const [userId, sId] of connectedUsers.entries()) {
      if (sId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    io.emit("users_online", Array.from(connectedUsers.keys()));
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
});
