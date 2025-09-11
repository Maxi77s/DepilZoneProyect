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
  // 🔑 WhatsApp Cloud API
  VERIFY_TOKEN: required("VERIFY_TOKEN"),
  WHATSAPP_TOKEN: required("WHATSAPP_TOKEN"),
  PHONE_NUMBER_ID: required("PHONE_NUMBER_ID"),
  WABA_ID: required("WABA_ID", ""), // opcional, solo para operaciones administrativas

  // 🔑 Plantillas WhatsApp
  WA_TEMPLATE_NAME: required("WA_TEMPLATE_NAME"),
  WA_TEMPLATE_LANG: required("WA_TEMPLATE_LANG", "es_AR"),
  WA_TEMPLATE_VIDEO_URL: required("WA_TEMPLATE_VIDEO_URL", ""),
};
