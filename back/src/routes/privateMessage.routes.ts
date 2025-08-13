import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { PrivateMessage } from "../models/PrivateMessage";

const router = Router();

// Enviar mensaje privado
router.post("/:receiverId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const senderId = (req as any).user.id;
    const { receiverId } = req.params;

    if (!text) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    const message = await PrivateMessage.create({
      from: senderId,
      to: receiverId,
      text,
      read: false
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Error al enviar mensaje privado", error });
  }
});

// Obtener historial de mensajes privados con un usuario
router.get("/:receiverId", requireAuth, async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const { receiverId } = req.params;

    const messages = await PrivateMessage.find({
      $or: [
        { from: myId, to: receiverId },
        { from: receiverId, to: myId },
      ]
    })
      .sort({ createdAt: 1 })
      .populate("from", "name email")
      .populate("to", "name email");

    // 🔹 Marcar como leídos los mensajes recibidos por el usuario actual
    await PrivateMessage.updateMany(
      { to: myId, from: receiverId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener mensajes privados", error });
  }
});

export default router;
