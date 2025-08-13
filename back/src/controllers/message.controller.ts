import { Request, Response } from "express";
import { Message } from "../models/Message";
import { Room } from "../models/Rooms";
import { z } from "zod";

// Validación con Zod
const messageSchema = z.object({
  roomId: z.string().min(1, "La sala es obligatoria"),
  text: z.string().min(1, "El mensaje no puede estar vacío").max(500, "El mensaje es demasiado largo"),
});

export async function createMessage(req: Request, res: Response) {
  try {
    // Validar datos
    const parsedData = messageSchema.parse(req.body);
    const { roomId, text } = parsedData;
    const userId = (req as any).user.id; // viene del middleware auth

    // Verificar que la sala exista
    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ message: "Sala no encontrada" });
    }

    // Crear mensaje
    const message = await Message.create({
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
    }
    console.error("[createMessage]", error);
    res.status(500).json({ message: "Error al crear mensaje" });
  }
}

export async function getMessagesByRoom(req: Request, res: Response) {
  try {
    const { roomId } = req.params;

    // Validar que la sala exista
    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ message: "Sala no encontrada" });
    }

    // Buscar mensajes
    const messages = await Message.find({ room: roomId })
      .populate("sender", "name email avatarUrl")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("[getMessagesByRoom]", error);
    res.status(500).json({ message: "Error al obtener mensajes" });
  }
}
