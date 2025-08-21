import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { PrivateMessage } from "../models/PrivateMessage";
import mongoose, { Types } from "mongoose";

const router = Router();

// 📤 Enviar mensaje privado
router.post("/:receiverId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const senderId = req.user!.id; // con types
    const { receiverId } = req.params;

    if (!text) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    const message = await PrivateMessage.create({
      from: new mongoose.Types.ObjectId(senderId),
      to: new mongoose.Types.ObjectId(receiverId),
      text,
      read: false,
    });

    const normalized = {
      _id: (message._id as Types.ObjectId).toString(),
      from: (message.from as Types.ObjectId).toString(),
      to: (message.to as Types.ObjectId).toString(),
      text: message.text,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };

    res.status(201).json(normalized);
  } catch (error) {
    console.error("[POST mensaje] error:", error);
    res.status(500).json({ message: "Error al enviar mensaje privado", error });
  }
});

// 📜 Obtener historial de mensajes con un usuario
router.get("/:receiverId", requireAuth, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.id;
    const { receiverId } = req.params;

    const myObjectId = new mongoose.Types.ObjectId(myId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const messages = await PrivateMessage.find({
      $or: [
        { from: myObjectId, to: receiverObjectId },
        { from: receiverObjectId, to: myObjectId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    const normalized = messages.map((m) => ({
      _id: (m._id as Types.ObjectId).toString(),
      from: (m.from as Types.ObjectId).toString(),
      to: (m.to as Types.ObjectId).toString(),
      text: m.text,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    res.json(normalized);
  } catch (error) {
    console.error("[GET mensajes] error:", error);
    res.status(500).json({ message: "Error al obtener mensajes privados", error });
  }
});

export default router;
