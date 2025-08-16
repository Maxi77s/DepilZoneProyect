// src/routes/auth.router.ts
import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller";

const router = Router();

// Registro de usuario
router.post("/register", register);

// Login de usuario
router.post("/login", login);

// Logout (actualiza isConnected en la DB y emite evento con socket.io)
router.post("/logout", logout);

export default router;
