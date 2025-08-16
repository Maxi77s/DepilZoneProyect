import { Request, Response } from "express";
import { User } from "../models/User";

/**
 * Obtener todos los usuarios sin enviar la contraseña
 */
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await User.find({}, { passwordHash: 0 }); // excluye passwordHash
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
