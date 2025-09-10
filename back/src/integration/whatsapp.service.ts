// src/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import { env } from "../config/env"; // 👈 ojo: ruta correcta desde /integrations/whatsapp
const GRAPH_BASE = "https://graph.facebook.com/v23.0";

// Normaliza a dígitos (E.164 sin '+')
function normalizeE164(n: string) {
  return (n ?? "").toString().replace(/[^\d]/g, "");
}

export async function waSendText(to: string, body: string) {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizeE164(to),
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
    // 🔎 imprime el motivo real que manda Meta (token inválido, número no permitido, etc.)
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error("[WA] send error:", status, data || e?.message);
    throw e;
  }
}

// Ejemplo plantilla
export async function waSendTemplate(to: string, name: string, lang = "es") {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizeE164(to),
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
