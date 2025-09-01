"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
async function register(req, res) {
    try {
        const { email, name, password } = req.body;
        const exists = await User_1.User.findOne({ email });
        if (exists) {
            return res.status(409).json({ message: "Email ya registrado" });
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const user = await User_1.User.create({
            email,
            name,
            passwordHash,
            isConnected: true, // Nuevo usuario arranca conectado
        });
        const token = (0, jwt_1.signToken)({ id: user._id.toString(), email: user.email });
        res.status(201).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                isConnected: user.isConnected,
            },
        });
    }
    catch (error) {
        console.error("Error en register:", error);
        res.status(500).json({ message: "Error en el registro", error });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        const isValid = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        // Actualizar estado de conexión
        user.isConnected = true;
        await user.save();
        const token = (0, jwt_1.signToken)({ id: user._id.toString(), email: user.email });
        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                isConnected: user.isConnected,
            },
        });
    }
    catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error en el login", error });
    }
}
async function logout(req, res) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId requerido" });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        user.isConnected = false;
        await user.save();
        // emitir evento a sockets (si usas socket.io)
        req.app.get("io")?.emit("userDisconnected", { userId });
        res.json({ success: true, message: "Sesión cerrada correctamente" });
    }
    catch (error) {
        console.error("Error en logout:", error);
        res.status(500).json({ message: "Error en el logout", error });
    }
}
//# sourceMappingURL=auth.controller.js.map