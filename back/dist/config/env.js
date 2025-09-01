"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(key, fallback) {
    const value = process.env[key] ?? fallback;
    if (!value)
        throw new Error(`Falta la variable de entorno: ${key}`);
    return value;
}
exports.env = {
    PORT: parseInt(required("PORT", "8080")),
    MONGO_URI: required("MONGO_URI"),
    JWT_SECRET: required("JWT_SECRET"),
    CORS_ORIGIN: required("CORS_ORIGIN", "*").split(","),
};
//# sourceMappingURL=env.js.map