import dotenv from "dotenv";
dotenv.config();

function required(key: string, fallback?: string) {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Falta la variable de entorno: ${key}`);
  return value;
}

export const env = {
  PORT: parseInt(required("PORT", "8080")),
  MONGO_URI: required("MONGO_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  CORS_ORIGIN: required("CORS_ORIGIN", "*").split(","),
};
