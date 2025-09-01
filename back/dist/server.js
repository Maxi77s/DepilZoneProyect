"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const privateMessage_routes_1 = __importDefault(require("./routes/privateMessage.routes"));
const PrivateMessage_1 = require("./models/PrivateMessage");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const User_1 = require("./models/User");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares globales
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express_1.default.json());
// Rate limiting (solo auth; en dev queda desactivado)
const authLimiter = (0, express_rate_limit_1.default)({
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
app.use("/auth", authLimiter, auth_routes_1.default);
app.use("/messages", message_routes_1.default);
app.use("/rooms", room_routes_1.default);
app.use("/private-messages", privateMessage_routes_1.default);
app.use("/users", user_routes_1.default);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: process.env.CORS_ORIGIN?.split(",") || "*" },
});
// Guardar `io` en app para usar en controladores
app.set("io", io);
// userId -> socketId
const connectedUsers = new Map();
io.on("connection", (socket) => {
    console.log("[SOCKET] connected:", socket.id);
    // Usuario se conecta (desde el cliente emiten user_connected)
    socket.on("user_connected", async (userId, ack) => {
        try {
            socket.data.userId = userId;
            connectedUsers.set(userId, socket.id);
            const upd = await User_1.User.updateOne({ _id: userId }, { $set: { isConnected: true } });
            console.log("[SOCKET] user_connected -> DB set true", userId, "matched:", upd.matchedCount, "modified:", upd.modifiedCount);
            // Enviar lista de usuarios conectados (IDs)
            io.emit("users_online", Array.from(connectedUsers.keys()));
            // Mensajes no leídos
            const unread = await PrivateMessage_1.PrivateMessage.find({ to: userId, read: false });
            if (unread.length > 0) {
                socket.emit("unread_messages", unread);
                await PrivateMessage_1.PrivateMessage.updateMany({ to: userId, read: false }, { $set: { read: true } });
            }
            if (typeof ack === "function")
                ack({ ok: true });
        }
        catch (e) {
            console.error("[SOCKET] user_connected error", e);
            if (typeof ack === "function")
                ack({ ok: false });
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
        const from = socket.data.userId;
        if (!from)
            return;
        try {
            const saved = await PrivateMessage_1.PrivateMessage.create({ from, to, text });
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
                await PrivateMessage_1.PrivateMessage.findByIdAndUpdate(saved._id, { read: true });
            }
        }
        catch (err) {
            console.error("[SOCKET] ❌ Error guardando mensaje:", err);
        }
    });
    // Logout manual (desde botón)
    socket.on("user_logout", async (userId, ack) => {
        try {
            connectedUsers.delete(userId);
            const upd = await User_1.User.updateOne({ _id: userId }, { $set: { isConnected: false } });
            console.log("[SOCKET] user_logout -> DB set false", userId, "matched:", upd.matchedCount, "modified:", upd.modifiedCount);
            io.emit("users_online", Array.from(connectedUsers.keys()));
            io.emit("userDisconnected", userId);
            if (typeof ack === "function")
                ack({ ok: true });
            // opcional: cortar el socket del cliente que desloguea
            // socket.disconnect(true);
        }
        catch (e) {
            console.error("[SOCKET] user_logout error", e);
            if (typeof ack === "function")
                ack({ ok: false });
        }
    });
    // Desconexión (cierre pestaña, perder internet, etc.)
    socket.on("disconnect", async (reason) => {
        const userId = socket.data.userId;
        console.log("[SOCKET] disconnect:", socket.id, "reason:", reason, "userId:", userId);
        if (userId) {
            connectedUsers.delete(userId);
            const upd = await User_1.User.updateOne({ _id: userId }, { $set: { isConnected: false } });
            console.log("[SOCKET] disconnect -> DB set false", userId, "matched:", upd.matchedCount, "modified:", upd.modifiedCount);
            io.emit("users_online", Array.from(connectedUsers.keys()));
            io.emit("userDisconnected", userId);
        }
    });
});
const PORT = process.env.PORT || 8080;
(0, db_1.connectDB)().then(() => {
    server.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
});
//# sourceMappingURL=server.js.map