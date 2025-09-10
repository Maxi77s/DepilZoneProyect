// src/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import { env } from "../config/env";

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

// Debug activado
const WA_DEBUG = true;

/**
 * Devuelve el número exactamente como lo pide el webhook (solo dígitos, sin '+').
 * Si ya viene del webhook (ej: "5493585047802") lo retorna igual.
 */
function normalizeE164(n: string) {
  const raw = n ?? "";
  const normalized = raw.replace(/[^\d]/g, ""); // asegura solo dígitos

  if (WA_DEBUG) {
    console.log("[WA] normalizeE164:", { raw, normalized });
  }

  return normalized;
}

export async function waSendText(to: string, body: string) {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const toRaw = to;
  const toNormalized = normalizeE164(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized, // 👈 exactamente como lo manda el webhook
    type: "text",
    text: { body },
  };

  if (WA_DEBUG) {
    console.log("[WA] waSendText -> about to POST", {
      url,
      toRaw,
      toNormalized,
      payload,
      phoneNumberId: env.PHONE_NUMBER_ID,
    });
  }

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (WA_DEBUG) {
      console.log("[WA] waSendText -> POST OK", { toNormalized });
    }
  } catch (e: any) {
    const status = e?.response?.status;
    const data = e?.response?.data;

    console.error("[WA] send error:", status, data || e?.message);
    console.error("[WA] context:", {
      toRaw,
      toNormalized,
      url,
      phoneNumberId: env.PHONE_NUMBER_ID,
    });

    throw e;
  }
}

export async function waSendTemplate(to: string, name: string, lang = "es") {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const toRaw = to;
  const toNormalized = normalizeE164(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized, // 👈 mismo formato que webhook
    type: "template",
    template: { name, language: { code: lang } },
  };

  if (WA_DEBUG) {
    console.log("[WA] waSendTemplate -> about to POST", {
      url,
      toRaw,
      toNormalized,
      payload,
      phoneNumberId: env.PHONE_NUMBER_ID,
    });
  }

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (WA_DEBUG) {
      console.log("[WA] waSendTemplate -> POST OK", { toNormalized });
    }
  } catch (e: any) {
    const status = e?.response?.status;
    const data = e?.response?.data;

    console.error("[WA] template error:", status, data || e?.message);
    console.error("[WA] context:", {
      toRaw,
      toNormalized,
      url,
      phoneNumberId: env.PHONE_NUMBER_ID,
    });

    throw e;
  }
}
