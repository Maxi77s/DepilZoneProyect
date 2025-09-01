"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const PrivateMessage_1 = require("../models/PrivateMessage");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// 📤 Enviar mensaje privado
router.post("/:receiverId", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { text } = req.body;
        const senderId = req.user.id; // con types
        const { receiverId } = req.params;
        if (!text) {
            return res.status(400).json({ message: "El mensaje no puede estar vacío" });
        }
        const message = await PrivateMessage_1.PrivateMessage.create({
            from: new mongoose_1.default.Types.ObjectId(senderId),
            to: new mongoose_1.default.Types.ObjectId(receiverId),
            text,
            read: false,
        });
        const normalized = {
            _id: message._id.toString(),
            from: message.from.toString(),
            to: message.to.toString(),
            text: message.text,
            read: message.read,
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt.toISOString(),
        };
        res.status(201).json(normalized);
    }
    catch (error) {
        console.error("[POST mensaje] error:", error);
        res.status(500).json({ message: "Error al enviar mensaje privado", error });
    }
});
// 📜 Obtener historial de mensajes con un usuario
router.get("/:receiverId", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const myId = req.user.id;
        const { receiverId } = req.params;
        const myObjectId = new mongoose_1.default.Types.ObjectId(myId);
        const receiverObjectId = new mongoose_1.default.Types.ObjectId(receiverId);
        const messages = await PrivateMessage_1.PrivateMessage.find({
            $or: [
                { from: myObjectId, to: receiverObjectId },
                { from: receiverObjectId, to: myObjectId },
            ],
        })
            .sort({ createdAt: 1 })
            .lean();
        const normalized = messages.map((m) => ({
            _id: m._id.toString(),
            from: m.from.toString(),
            to: m.to.toString(),
            text: m.text,
            read: m.read,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        }));
        res.json(normalized);
    }
    catch (error) {
        console.error("[GET mensajes] error:", error);
        res.status(500).json({ message: "Error al obtener mensajes privados", error });
    }
});
exports.default = router;
//# sourceMappingURL=privateMessage.routes.js.map