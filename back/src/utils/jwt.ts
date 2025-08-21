// src/utils/jwt.ts
import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload extends DefaultJwtPayload {
  id: string;
  email: string;
}

// 🔑 Firmar un token con payload { id, email }
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

// 🔍 Verificar token y devolver payload tipado
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
