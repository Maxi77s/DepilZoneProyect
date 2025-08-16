import { Request, Response } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  try {
    const { email, name, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email ya registrado" });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      name,
      passwordHash,
      isConnected: true, // Nuevo usuario arranca conectado
    });

    const token = signToken({ id: user._id.toString(), email: user.email });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isConnected: user.isConnected,
      },
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error en el registro", error });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Actualizar estado de conexión
    user.isConnected = true;
    await user.save();

    const token = signToken({ id: user._id.toString(), email: user.email });

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isConnected: user.isConnected,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el login", error });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId requerido" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    user.isConnected = false;
    await user.save();

    // emitir evento a sockets (si usas socket.io)
    req.app.get("io")?.emit("userDisconnected", { userId });

    res.json({ success: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ message: "Error en el logout", error });
  }
}
