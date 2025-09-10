// src/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import { env } from "../config/env";

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

export async function waSendText(to: string, body: string) {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };
  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

// Ejemplo plantilla
export async function waSendTemplate(to: string, name: string, lang = "es") {
  const url = `${GRAPH_BASE}/${env.PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: { name, language: { code: lang } },
  };
  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}
