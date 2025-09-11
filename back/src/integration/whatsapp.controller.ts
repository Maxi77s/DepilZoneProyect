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
  console.log("[WA][RAW]", JSON.stringify(req.body, null, 2));
  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change?.value;

        // 1) STATUS (sent|delivered|read|failed)
        if (Array.isArray(value?.statuses)) {
          for (const s of value.statuses) {
            console.log(
              "[WA][STATUS]",
              JSON.stringify(
                {
                  id: s.id,
                  status: s.status,
                  errors: s.errors,
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
        const messages = Array.isArray(value?.messages) ? value.messages : [];
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

          // A) Texto
          try {
            const textRes = await waSendText(from, reply);
            console.log(
              "[WA][TEXT][SENT]",
              JSON.stringify({ to: from, textMsgId: textRes?.msgId }, null, 2)
            );
          } catch (e: any) {
            console.error("[WA][TEXT][SEND_ERR]", e?.response?.data ?? e?.message ?? e);
          }

          // B) Template (header video.link + botón URL index 0)
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

          try {
            const tplRes = await waSendTemplate(
              from,
              env.WA_TEMPLATE_NAME, // "plantillachat"
              env.WA_TEMPLATE_LANG, // "es_AR"
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
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("[WA][WEBHOOK][ERR]", e);
    res.sendStatus(200);
  }
}
