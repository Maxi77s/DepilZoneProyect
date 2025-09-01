"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.getUserRooms = getUserRooms;
const Rooms_1 = require("../models/Rooms");
async function createRoom(req, res) {
    try {
        const { name, participants } = req.body;
        const room = await Rooms_1.Room.create({ name, participants });
        res.status(201).json(room);
    }
    catch (error) {
        res.status(500).json({ message: "Error al crear sala", error });
    }
}
async function getUserRooms(req, res) {
    try {
        const userId = req.user.id;
        const rooms = await Rooms_1.Room.find({ participants: userId })
            .populate("participants", "name email");
        res.json(rooms);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener salas", error });
    }
}
//# sourceMappingURL=room.controller.js.map