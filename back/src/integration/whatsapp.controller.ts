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

    const messages = value?.messages;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const from: string = msg.from;
        if (msg.type !== "text") continue;

        const text = (msg.text?.body ?? "").trim().toLowerCase();

        // Respuesta simple
        let reply = "Escribe 'menu' para ver opciones.";
        if (text === "hola") reply = "¡Hola! Soy tu bot 🤖";
        if (text === "menu") reply = "Opciones:\n1) estado\n2) ayuda";

        try { await waSendText(from, reply); } catch {}

        // === Enviar plantilla con botón URL DINÁMICO (plantilla tiene {{1}}) ===
        // Si tu plantilla tiene 1 botón con {{1}} en index 0, hay que mandar el parámetro.
        const btnSuffix = (env.WA_TEMPLATE_BTN_SUFFIX || "5LWUj1y8VMA").trim();

        const components = [
          {
            type: "button",
            sub_type: "url" as const,
            index: "0",
            parameters: [{ type: "text", text: btnSuffix }],
          },
        ];

        try {
          await waSendTemplate(
            from,
            env.WA_TEMPLATE_NAME, // p.ej. "plantillachat"
            env.WA_TEMPLATE_LANG, // p.ej. "es_AR"
            components
          );
        } catch {}
      }
    }

    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
}
