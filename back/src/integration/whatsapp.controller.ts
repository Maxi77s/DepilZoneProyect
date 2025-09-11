// src/integrations/whatsapp/whatsapp.controller.ts
import type { Request, Response } from "express";
import { env } from "../config/env";
import { waSendText, waSendTemplate } from "./whatsapp.service";

export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response) {
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;

    // 1) Procesar mensajes entrantes
    const messages = value?.messages;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const from: string = msg.from; // E.164 sin '+'
        if (msg.type !== "text") continue;

        const text = (msg.text?.body ?? "").trim().toLowerCase();

        // Respuesta simple
        let reply = "Escribe 'menu' para ver opciones.";
        if (text === "hola") reply = "¡Hola! Soy tu bot 🤖";
        if (text === "menu") reply = "Opciones:\n1) estado\n2) ayuda";

        // Enviar texto (errores silenciosos)
        try { await waSendText(from, reply); } catch {}

        // 2) Enviar plantilla SIN parámetros ni components (usa lo definido en Meta)
        try {
          await waSendTemplate(
            from,
            env.WA_TEMPLATE_NAME, // ej: "plantillachat"
            env.WA_TEMPLATE_LANG, // ej: "es_AR"
            []                    // sin components: header/body/botón vienen de la plantilla
          );
        } catch {}
      }
    }

    // 3) Siempre 200 para evitar reintentos de Meta
    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
}
