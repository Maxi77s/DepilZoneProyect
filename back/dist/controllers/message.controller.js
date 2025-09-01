"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = createMessage;
exports.getMessagesByRoom = getMessagesByRoom;
const Message_1 = require("../models/Message");
const Rooms_1 = require("../models/Rooms");
const zod_1 = require("zod");
// Validación con Zod
const messageSchema = zod_1.z.object({
    roomId: zod_1.z.string().min(1, "La sala es obligatoria"),
    text: zod_1.z.string().min(1, "El mensaje no puede estar vacío").max(500, "El mensaje es demasiado largo"),
});
async function createMessage(req, res) {
    try {
        // Validar datos
        const parsedData = messageSchema.parse(req.body);
        const { roomId, text } = parsedData;
        const userId = req.user.id; // viene del middleware auth
        // Verificar que la sala exista
        const roomExists = await Rooms_1.Room.findById(roomId);
        if (!roomExists) {
            return res.status(404).json({ message: "Sala no encontrada" });
        }
        // Crear mensaje
        const message = await Message_1.Message.create({
            room: roomId,
            sender: userId,
            text,
        });
        // Emitir por socket (si está configurado)
        const io = req.app.get("io");
        if (io) {
            io.to(roomId).emit("newMessage", message);
        }
        res.status(201).json(message);
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
        }
        console.error("[createMessage]", error);
        res.status(500).json({ message: "Error al crear mensaje" });
    }
}
async function getMessagesByRoom(req, res) {
    try {
        const { roomId } = req.params;
        // Validar que la sala exista
        const roomExists = await Rooms_1.Room.findById(roomId);
        if (!roomExists) {
            return res.status(404).json({ message: "Sala no encontrada" });
        }
        // Buscar mensajes
        const messages = await Message_1.Message.find({ room: roomId })
            .populate("sender", "name email avatarUrl")
            .sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (error) {
        console.error("[getMessagesByRoom]", error);
        res.status(500).json({ message: "Error al obtener mensajes" });
    }
}
//# sourceMappingURL=message.controller.js.map