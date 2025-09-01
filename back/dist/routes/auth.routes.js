"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.router.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Registro de usuario
router.post("/register", auth_controller_1.register);
// Login de usuario
router.post("/login", auth_controller_1.login);
// Logout (actualiza isConnected en la DB y emite evento con socket.io)
router.post("/logout", auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map