import { Router } from "express";
import { createRoom, getUserRooms } from "../controllers/room.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", requireAuth, createRoom); // crear sala
router.get("/", requireAuth, getUserRooms); // obtener salas del usuario

export default router;
