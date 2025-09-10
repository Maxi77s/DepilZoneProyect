// src/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import { env } from "../config/env";

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

// Debug activado
const WA_DEBUG = true;

/**
 * Normaliza un número al formato E.164 **sin el '+' inicial**
 * - Limpia caracteres no numéricos
 * - Si detecta que empieza con "549" (ej: Argentina móvil),
 *   lo convierte en "54" + resto (quita el 9).
 */
function normalizeE164(n: string) {
  const raw = n ?? "";
  let normalized = raw.replace(/[^\d]/g, ""); // asegura solo dígitos

  if (normalized.startsWith("549") && normalized.length > 11) {
    normalized = "54" + normalized.slice(3);
  }

  if (WA_DEBUG) {
    console.log("[WA] normalizeE164:", { raw, normalized });
  }

  return normalized;
}

function isRecipientNotAllowed(e: any) {
  const code = e?.response?.data?.error?.code;
  return code === 131030;
}

export async function waSendText(to: string, body: string) {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const toRaw = to;
  const toNormalized = normalizeE164(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
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
    if (isRecipientNotAllowed(e)) {
      console.error(
        "[WA] 131030: El destino no está en la whitelist del PHONE_NUMBER_ID.",
        {
          phoneNumberId: env.PHONE_NUMBER_ID,
          toRaw,
          toNormalized,
          hint: "Agregá este número EXACTO a la lista de destinatarios de prueba.",
        }
      );
    }
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
    to: toNormalized,
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
    if (isRecipientNotAllowed(e)) {
      console.error(
        "[WA] 131030: El destino no está en la whitelist del PHONE_NUMBER_ID.",
        {
          phoneNumberId: env.PHONE_NUMBER_ID,
          toRaw,
          toNormalized,
          hint: "Agregá este número EXACTO a la lista de destinatarios de prueba.",
        }
      );
    }
    console.error("[WA] context:", {
      toRaw,
      toNormalized,
      url,
      phoneNumberId: env.PHONE_NUMBER_ID,
    });

    throw e;
  }
}
