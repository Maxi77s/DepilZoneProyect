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

    // 👀 LOG DE STATUS SI EXISTE
    if (Array.isArray(value?.statuses)) {
      for (const s of value.statuses) {
        console.log("[WA][STATUS]", JSON.stringify({
          id: s.id,
          status: s.status,
          errors: s.errors,
          timestamp: s.timestamp
        }, null, 2));
      }
    }

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
        } catch (e) {
          console.error("[WA][TEXT][ERR]", e);
        }

        // ===== ARMADO DE COMPONENTS =====
        const components: any[] = [];

        const videoUrl = env.WA_TEMPLATE_VIDEO_URL?.trim();
        if (videoUrl && /\.mp4(\?.*)?$/.test(videoUrl)) {
          components.push({
            type: "header",
            parameters: [{ type: "video", video: { link: videoUrl } }],
          });
        }

        const btnSuffix = env.WA_TEMPLATE_BTN_SUFFIX?.trim();
        if (btnSuffix) {
          components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: btnSuffix }],
          });
        }

        // 👀 LOG DEL PAYLOAD ANTES DE ENVIAR
        console.log("[WA][TPL][PAYLOAD]", JSON.stringify({
          to: from,
          template: env.WA_TEMPLATE_NAME,
          language: env.WA_TEMPLATE_LANG,
          components
        }, null, 2));

        // ✅ ENVÍO UNA SOLA VEZ
        try {
          const result = await waSendTemplate(
            from,
            env.WA_TEMPLATE_NAME, // "plantillachat"
            env.WA_TEMPLATE_LANG, // "es_AR"
            components
          );
          // 👀 LOG DE RESULTADO
          console.log("[WA][TPL][SENT]", JSON.stringify(result, null, 2));
        } catch (e: any) {
          console.error("[WA][TPL][ERR]", e?.response?.data ?? e?.message ?? e);
        }
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("[WA][WEBHOOK][ERR]", e);
    res.sendStatus(200);
  }
}
