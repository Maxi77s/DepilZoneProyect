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

        try {
          await waSendText(from, reply);
        } catch {}

        // === Enviar plantilla con botón URL DINÁMICO (plantilla tiene {{1}}) ===
        // Si tu plantilla tiene 1 botón con {{1}} en index 0, hay que mandar el parámetro.

        // ===== ARMADO DE COMPONENTS =====
        const components: any[] = [];

        // HEADER: video .mp4 obligatorio (la plantilla lo espera)
        const videoUrl = env.WA_TEMPLATE_VIDEO_URL?.trim();
        if (!videoUrl || !/\.mp4(\?.*)?$/.test(videoUrl)) {
          // Si no tenés un .mp4 público válido, no intentes enviar la plantilla
          // porque WhatsApp va a rechazarla por "header parameter empty".
          // Podés salir silenciosamente o avisar por log.
          // return; // si querés abortar el envío de la plantilla
        } else {
          components.push({
            type: "header",
            parameters: [{ type: "video", video: { link: videoUrl } }],
          });
        }

        // BOTÓN URL: solo si tu botón tiene {{1}} (es dinámico)
        const btnSuffix = env.WA_TEMPLATE_BTN_SUFFIX?.trim();
        if (btnSuffix) {
          components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: btnSuffix }],
          });
        }

        // Enviar la plantilla
        await waSendTemplate(
          from,
          env.WA_TEMPLATE_NAME, // "plantillachat"
          env.WA_TEMPLATE_LANG, // "es_AR"
          components
        );

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
