"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
const User_1 = require("../models/User");
/**
 * Obtener todos los usuarios sin enviar la contraseña
 */
async function getAllUsers(req, res) {
    try {
        const users = await User_1.User.find({}, { passwordHash: 0 }); // excluye passwordHash
        res.json(users);
    }
    catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
//# sourceMappingURL=user.controller.js.map