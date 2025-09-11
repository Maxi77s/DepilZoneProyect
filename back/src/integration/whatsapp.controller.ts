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
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // 1) STATUS de mensajes salientes (sent|delivered|read|failed)
    if (Array.isArray(value?.statuses)) {
      for (const s of value.statuses) {
        console.log(
          "[WA][STATUS]",
          JSON.stringify(
            {
              id: s.id,                // correlacionar con msgId del POST
              status: s.status,        // sent | delivered | read | failed
              errors: s.errors,        // [{ code, title, details }] si failed
              recipient_id: s.recipient_id,
              timestamp: s.timestamp,
              conversation: s.conversation,
              pricing: s.pricing,
            },
            null,
            2
          )
        );
      }
    }

    // 2) MENSAJES entrantes
    const messages = value?.messages;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const from: string = msg.from;
        const type: string | undefined = msg.type;

        console.log(
          "[WA][INCOMING]",
          JSON.stringify(
            {
              from,
              type,
              text: msg.text?.body,
              metadata_phone_number_id: value?.metadata?.phone_number_id,
            },
            null,
            2
          )
        );

        if (type !== "text") continue;

        const text = (msg.text?.body ?? "").trim().toLowerCase();

        // Respuesta simple
        let reply = "Escribe 'menu' para ver opciones.";
        if (text === "hola") reply = "¡Hola! Soy tu bot 🤖";
        if (text === "menu") reply = "Opciones:\n1) estado\n2) ayuda";

        // A) Enviar texto y loguear msgId para correlación
        try {
          const textRes = await waSendText(from, reply);
          console.log(
            "[WA][TEXT][SENT]",
            JSON.stringify({ to: from, textMsgId: textRes?.msgId }, null, 2)
          );
        } catch (e: any) {
          console.error("[WA][TEXT][SEND_ERR]", e?.response?.data ?? e?.message ?? e);
        }

        // B) Armar components del template
        const components: any[] = [];

        const videoUrl = env.WA_TEMPLATE_VIDEO_URL?.trim();
        if (videoUrl && /\.mp4(\?.*)?$/.test(videoUrl)) {
          components.push({
            type: "header",
            parameters: [{ type: "video", video: { link: videoUrl } }],
          });
        } else {
          console.warn("[WA][TPL][SKIP_HEADER] videoUrl inválido o no .mp4", { videoUrl });
        }

        const btnSuffix = env.WA_TEMPLATE_BTN_SUFFIX?.trim();
        if (btnSuffix) {
          components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: btnSuffix }],
          });
        } else {
          console.warn("[WA][TPL][SKIP_BUTTON] WA_TEMPLATE_BTN_SUFFIX vacío");
        }

        if (!env.WA_TEMPLATE_NAME || !env.WA_TEMPLATE_LANG) {
          console.error("[WA][TPL][ABORT] Falta WA_TEMPLATE_NAME o WA_TEMPLATE_LANG");
          continue;
        }

        // C) Log del payload del template antes de enviar
        console.log(
          "[WA][TPL][PAYLOAD]",
          JSON.stringify(
            {
              to: from,
              template: env.WA_TEMPLATE_NAME,
              language: env.WA_TEMPLATE_LANG,
              components,
            },
            null,
            2
          )
        );

        // D) Enviar plantilla UNA sola vez y loguear msgId
        try {
          const tplRes = await waSendTemplate(
            from,
            env.WA_TEMPLATE_NAME, // p.ej. "plantillachat"
            env.WA_TEMPLATE_LANG, // p.ej. "es_AR"
            components
          );
          console.log(
            "[WA][TPL][SENT]",
            JSON.stringify({ to: from, tplMsgId: tplRes?.msgId }, null, 2)
          );
        } catch (e: any) {
          console.error("[WA][TPL][SEND_ERR]", e?.response?.data ?? e?.message ?? e);
        }
      }
    }

    // Siempre devolver 200 para evitar reintentos
    res.sendStatus(200);
  } catch (e) {
    console.error("[WA][WEBHOOK][ERR]", e);
    res.sendStatus(200);
  }
}
