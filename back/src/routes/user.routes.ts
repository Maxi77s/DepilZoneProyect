import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller";

const router = Router();

// GET /users -> lista todos los usuarios
router.get("/", getAllUsers);

export default router;
