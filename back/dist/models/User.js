"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    isConnected: { type: Boolean, default: false }
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", userSchema);
//# sourceMappingURL=User.js.map