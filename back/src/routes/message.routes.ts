import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { Message } from "../models/Message";

const router = Router();

router.post("/:roomId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const senderId = (req as any).user.id;
    const { roomId } = req.params;

    if (!text) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    // Guardar en Mongo
    const message = await Message.create({
      room: roomId,
      sender: senderId,
      text,
    });

    // Emitir en tiempo real
    const io = req.app.get("io");
    io.to(roomId).emit("newMessage", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Error al enviar mensaje de sala", error });
  }
});

export default router;
