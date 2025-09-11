// src/integrations/whatsapp/whatsapp.controller.ts
import type { Request, Response } from "express";
import { env } from "../config/env";
import { waSendText, waSendTemplate } from "./whatsapp.service";

export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.VERIFY_TOKEN) {
    console.log("[WA] Webhook verificado correctamente");
    return res.status(200).send(challenge);
  }
  console.warn("[WA] Webhook verification failed");
  return res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response) {
  try {
    // Log completo para depurar
    console.log("🌐 Webhook recibido:", JSON.stringify(req.body, null, 2));

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // 1) Mensajes entrantes
    const messages = value?.messages;
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        console.log("📩 Mensaje entrante:", msg);

        const from: string = msg.from; // E.164 sin '+'
        const type: string = msg.type;

        if (type === "text") {
          const text = (msg.text?.body ?? "").trim().toLowerCase();
          console.log("✍️ Texto recibido:", text);

          let reply = "Escribe 'menu' para ver opciones.";
          if (text === "hola") reply = "¡Hola! Soy tu bot 🤖";
          if (text === "menu") reply = "Opciones:\n1) estado\n2) ayuda";

          console.log("📤 Respuesta a enviar:", reply);
          try {
            await waSendText(from, reply);
          } catch (err) {
            console.error("[WA] Error enviando respuesta:", err);
          }

          // Enviar la plantilla con header de VIDEO y botón URL dinámico
          try {
            type TemplateParam =
              | { type: "text"; text: string }
              | { type: "video"; video: { id?: string; link?: string } };

            // HEADER: usa MEDIA_ID o URL .mp4 (YouTube NO funciona aquí)
            const headerParams: TemplateParam[] =
              env.WA_TEMPLATE_VIDEO_URL
                ? [{ type: "video", video: { id: env.WA_TEMPLATE_VIDEO_URL } }]
                : env.WA_TEMPLATE_VIDEO_URL
                ? [{ type: "video", video: { link: env.WA_TEMPLATE_VIDEO_URL } }]
                : [];

            // BODY: tu plantilla no usa variables en body (vacío). Si agregás {{1}}, {{2}}, ponelos acá.
            const bodyParams: TemplateParam[] = [];

            // BUTTON URL dinámico (index 0): si la plantilla tiene URL con {{1}}, DEBES enviar este parámetro.
            // Ej: si la URL base es https://youtube.com/watch?v=  -> WA_TEMPLATE_BTN_SUFFIX=dQw4w9WgXcQ
            const buttonComponents =
              env.WA_TEMPLATE_BTN_SUFFIX && env.WA_TEMPLATE_BTN_SUFFIX.trim().length > 0
                ? [
                    {
                      type: "button",
                      sub_type: "url" as const,
                      index: "0",
                      parameters: [{ type: "text", text: env.WA_TEMPLATE_BTN_SUFFIX! }],
                    },
                  ]
                : [];

            const components: any[] = [];
            if (headerParams.length) components.push({ type: "header", parameters: headerParams });
            if (bodyParams.length) components.push({ type: "body", parameters: bodyParams });
            if (buttonComponents.length) components.push(...buttonComponents);

            console.log("[WA] Enviando plantilla:", {
              name: env.WA_TEMPLATE_NAME,
              lang: env.WA_TEMPLATE_LANG,
              hasHeaderVideo: headerParams.length > 0,
              bodyVars: bodyParams.length,
              buttonParamSent: buttonComponents.length > 0,
            });

            await waSendTemplate(from, env.WA_TEMPLATE_NAME, env.WA_TEMPLATE_LANG, components);
            console.log("[WA] Plantilla enviada OK");
          } catch (err: any) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            console.error("[WA] template error:", status, data || err?.message);
            console.error(
              "[WA] Tips: Verificá name/lang EXACTO; header VIDEO con MEDIA_ID o URL .mp4 pública; " +
                "y si el botón URL tiene {{1}}, enviar parameters (suffix) en index 0."
            );
          }
        } else {
          console.log(`ℹ️ Tipo de mensaje no manejado (${type}).`);
        }
      }
    }

    // 2) Status (sent, delivered, read, failed, etc.)
    const statuses = value?.statuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      for (const st of statuses) {
        console.log("📦 Status entrante:", st);
      }
    }

    // Siempre 200 para evitar reintentos
    res.sendStatus(200);
  } catch (err) {
    console.error("[WA] webhook error:", err);
    res.sendStatus(500);
  }
}
