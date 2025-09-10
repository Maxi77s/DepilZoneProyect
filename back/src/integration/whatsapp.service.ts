// src/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import { env } from "../config/env";

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

/**
 * Normaliza un número al formato E.164 **sin el '+' inicial**
 * - Limpia caracteres no numéricos
 * - NO agrega "9" por defecto
 * - Usa exactamente los dígitos que le pases (ej: 543585047802)
 */
function normalizeE164(n: string) {
  if (!n) return "";
  return n.replace(/[^\d]/g, ""); // solo deja dígitos
}

export async function waSendText(to: string, body: string) {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizeE164(to), // ✅ acepta "543585047802" sin agregar 9
    type: "text",
    text: { body },
  };

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (e: any) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error("[WA] send error:", status, data || e?.message);
    throw e;
  }
}

export async function waSendTemplate(to: string, name: string, lang = "es") {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizeE164(to), // ✅ usa exactamente lo que le pases
    type: "template",
    template: { name, language: { code: lang } },
  };

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (e: any) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error("[WA] template error:", status, data || e?.message);
    throw e;
  }
}
