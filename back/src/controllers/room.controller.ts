import { Request, Response } from "express";
import { Room } from "../models/Rooms";

export async function createRoom(req: Request, res: Response) {
  try {
    const { name, participants } = req.body;

    const room = await Room.create({ name, participants });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Error al crear sala", error });
  }
}

export async function getUserRooms(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    const rooms = await Room.find({ participants: userId })
      .populate("participants", "name email");

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener salas", error });
  }
}
