import { Request, Response } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  const { email, name, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email ya registrado" });

  const passwordHash = await hashPassword(password);

  const user = await User.create({ email, name, passwordHash });

  const token = signToken({ id: user._id.toString(), email: user.email });

  res.status(201).json({
    token,
    user: { id: user._id, email: user.email, name: user.name }
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ message: "Credenciales inválidas" });

  const token = signToken({ id: user._id.toString(), email: user.email });

  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name }
  });
}
