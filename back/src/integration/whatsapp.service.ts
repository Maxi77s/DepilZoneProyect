// src/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
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

function endpointMessages() {
  return `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
}

function endpointMedia() {
  return `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/media`;
}
/* =========================================================
 *  TEXT
 * =======================================================*/
export async function waSendText(to: string, body: string) {
  const url = endpointMessages();
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
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const msgId = res?.data?.messages?.[0]?.id;
    if (WA_DEBUG) {
      console.log("[WA] waSendText -> POST OK", { toNormalized, msgId, http: res.status });
    }
    // ⬅ devolver message_id para correlacionar con statuses
    return { ok: true, msgId, data: res.data };
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

/* =========================================================
 *  TEMPLATE (con componentes)
 * =======================================================*/

/**
 * Tipado mínimo para components (libre y compatible con WhatsApp Cloud API).
 * Podés especializarlo más si querés.
 */
export type WaTemplateComponent = {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url" | "copy_code"; // para buttons
  index?: string; // p.ej. "0"
  parameters?: Array<
    | { type: "text"; text: string }
    | { type: "currency"; currency: { fallback_value: string; code: string; amount_1000: number } }
    | { type: "date_time"; date_time: { fallback_value: string } }
    | { type: "image"; image: { link?: string; id?: string; caption?: string } }
    | { type: "document"; document: { link?: string; id?: string; filename?: string } }
    | { type: "video"; video: { link?: string; id?: string; caption?: string } }
  >;
};

/**
 * Envía una plantilla (HSM) ya aprobada en Business Manager.
 * - name: nombre EXACTO de la plantilla
 * - lang: código de idioma (ej: "es_AR", "es", "en_US")
 * - components: header/body/buttons con parámetros
 */
/* =========================================================
 *  TEMPLATE (con componentes)
 * =======================================================*/
export async function waSendTemplate(
  to: string,
  name: string,
  lang = "es",
  components?: WaTemplateComponent[]
) {
  const url = endpointMessages();
  const toRaw = to;
  const toNormalized = normalizeE164(to);

  const payload: any = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "template",
    template: {
      name,
      language: { code: lang },
      ...(components?.length ? { components } : {}),
    },
  };

  // ⬅ log legible del template que se envía
  if (WA_DEBUG) {
    console.log("[WA] waSendTemplate -> PAYLOAD", JSON.stringify({
      url,
      toRaw,
      toNormalized,
      template: payload.template,
      phoneNumberId: env.PHONE_NUMBER_ID,
    }, null, 2));
  }

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const msgId = res?.data?.messages?.[0]?.id;
    if (WA_DEBUG) {
      console.log("[WA] waSendTemplate -> POST OK", { toNormalized, name, lang, msgId, http: res.status });
    }
    // ⬅ devolver message_id para correlacionar con statuses
    return { ok: true, msgId, data: res.data };
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
      name,
      lang
    });

    throw e;
  }
}

/**
 * Helpers convenientes para construir parámetros de body y header
 */
export const Tpl = {
  bodyTextParams: (...values: string[]): WaTemplateComponent => ({
    type: "body",
    parameters: values.map((v) => ({ type: "text", text: v })),
  }),

  headerImageByUrl: (url: string, caption?: string): WaTemplateComponent => ({
    type: "header",
    parameters: [{ type: "image", image: { link: url, ...(caption ? { caption } : {}) } }],
  }),

  headerImageById: (id: string, caption?: string): WaTemplateComponent => ({
    type: "header",
    parameters: [{ type: "image", image: { id, ...(caption ? { caption } : {}) } }],
  }),

  // Button quick reply (no lleva parameters)
  buttonQuickReply: (index = "0"): WaTemplateComponent => ({
    type: "button",
    sub_type: "quick_reply",
    index,
  }),

  // Button URL con placeholder {{1}} -> se pasa como body param, no acá
  buttonUrl: (index = "0"): WaTemplateComponent => ({
    type: "button",
    sub_type: "url",
    index,
  }),
};

/* =========================================================
 *  MEDIA: subir y enviar imagen
 * =======================================================*/

/**
 * Sube un archivo local al bucket de WhatsApp y retorna { id } (MEDIA_ID).
 * @param filePath Ruta absoluta o relativa (jpg/png/pdf/…)
 * @param mimeType "image/jpeg", "image/png", "application/pdf", etc.
 */
export async function waUploadMedia(filePath: string, mimeType: string) {
  const url = endpointMedia();

  if (WA_DEBUG) {
    console.log("[WA] waUploadMedia -> about to POST", { filePath, mimeType });
  }

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append("file", fs.createReadStream(path.resolve(filePath)));

  try {
    const { data } = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      },
    });
    if (WA_DEBUG) {
      console.log("[WA] waUploadMedia -> OK", data);
    }
    return data as { id: string };
  } catch (e: any) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error("[WA] upload media error:", status, data || e?.message);
    throw e;
  }
}

/** Enviar imagen por URL (sin subir) */
export async function waSendImageByUrl(to: string, imageUrl: string, caption?: string) {
  const url = endpointMessages();
  const toNormalized = normalizeE164(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "image",
    image: { link: imageUrl, ...(caption ? { caption } : {}) },
  };

  if (WA_DEBUG) console.log("[WA] waSendImageByUrl ->", payload);

  await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
  });
}

/** Enviar imagen por MEDIA_ID (recomendado en prod) */
export async function waSendImageByMediaId(to: string, mediaId: string, caption?: string) {
  const url = endpointMessages();
  const toNormalized = normalizeE164(to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "image",
    image: { id: mediaId, ...(caption ? { caption } : {}) },
  };

  if (WA_DEBUG) console.log("[WA] waSendImageByMediaId ->", payload);

  await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
  });
}
