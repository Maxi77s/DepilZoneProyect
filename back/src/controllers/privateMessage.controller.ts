import { Request, Response } from "express";
import { PrivateMessage } from "../models/PrivateMessage";

export async function sendPrivateMessage(req: Request, res: Response) {
  try {
    const { to, text } = req.body;
    const from = (req as any).user.id;

    const msg = await PrivateMessage.create({ from, to, text });
    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ message: "Error enviando mensaje privado", error });
  }
}

export async function getPrivateMessages(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const myId = (req as any).user.id;

    const messages = await PrivateMessage.find({
      $or: [
        { from: myId, to: userId },
        { from: userId, to: myId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo mensajes privados", error });
  }
}
