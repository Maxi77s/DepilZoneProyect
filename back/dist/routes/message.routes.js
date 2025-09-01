"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const Message_1 = require("../models/Message");
const router = (0, express_1.Router)();
// 📌 Obtener historial de mensajes de una sala
router.get("/:roomId", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await Message_1.Message.find({ room: roomId })
            .populate("sender", "name email") // opcional, para mostrar datos del usuario
            .sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (error) {
        console.error("[API] Error al obtener mensajes de sala:", error);
        res.status(500).json({ message: "Error al obtener historial de la sala" });
    }
});
// 📌 Enviar un mensaje a una sala
router.post("/:roomId", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { text } = req.body;
        const senderId = req.user.id;
        const { roomId } = req.params;
        if (!text) {
            return res.status(400).json({ message: "El mensaje no puede estar vacío" });
        }
        // Guardar en Mongo
        const message = await Message_1.Message.create({
            room: roomId,
            sender: senderId,
            text,
        });
        // Emitir en tiempo real
        const io = req.app.get("io");
        io.to(roomId).emit("newMessage", message);
        res.status(201).json(message);
    }
    catch (error) {
        console.error("[API] Error al enviar mensaje de sala:", error);
        res.status(500).json({ message: "Error al enviar mensaje de sala", error });
    }
});
exports.default = router;
//# sourceMappingURL=message.routes.js.map