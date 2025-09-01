"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPrivateMessage = sendPrivateMessage;
exports.getPrivateMessages = getPrivateMessages;
const PrivateMessage_1 = require("../models/PrivateMessage");
async function sendPrivateMessage(req, res) {
    try {
        const { to, text } = req.body;
        const from = req.user.id;
        const msg = await PrivateMessage_1.PrivateMessage.create({ from, to, text });
        res.status(201).json(msg);
    }
    catch (error) {
        res.status(500).json({ message: "Error enviando mensaje privado", error });
    }
}
async function getPrivateMessages(req, res) {
    try {
        const { userId } = req.params;
        const myId = req.user.id;
        const messages = await PrivateMessage_1.PrivateMessage.find({
            $or: [
                { from: myId, to: userId },
                { from: userId, to: myId }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ message: "Error obteniendo mensajes privados", error });
    }
}
//# sourceMappingURL=privateMessage.controller.js.map