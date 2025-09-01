"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_controller_1 = require("../controllers/room.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.requireAuth, room_controller_1.createRoom); // crear sala
router.get("/", auth_middleware_1.requireAuth, room_controller_1.getUserRooms); // obtener salas del usuario
exports.default = router;
//# sourceMappingURL=room.routes.js.map