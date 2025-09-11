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
    // 🔎 Log completo para depurar
    console.log("🌐 Webhook recibido:", JSON.stringify(req.body, null, 2));

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // ✅ 1) Mensajes entrantes
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

          // 🔵 Enviar la plantilla con header de VIDEO (MEDIA_ID o URL)
          try {
            // Armamos components según tengas MEDIA_ID o URL
            const headerParams =
              env.WA_TEMPLATE_VIDEO_MEDIA_ID
                ? [{ type: "video", video: { id: env.WA_TEMPLATE_VIDEO_MEDIA_ID } }]
                : env.WA_TEMPLATE_VIDEO_URL
                ? [{ type: "video", video: { link: env.WA_TEMPLATE_VIDEO_URL } }]
                : [];

            // Si tu body tiene {{1}} {{2}}, agregá la misma cantidad aquí:
            interface TemplateParameter {
              type: "text" | "video";
              text?: string;
              video?: { id?: string; link?: string };
            }

            const bodyParams: TemplateParameter[] = [
              // { type: "text", text: "Maxi" },
              // { type: "text", text: "Mensaje de info del chat" },
            ];

            const components: any[] = [];
            if (headerParams.length) components.push({ type: "header", parameters: headerParams });
            if (bodyParams.length) components.push({ type: "body", parameters: bodyParams });

            console.log("[WA] Enviando plantilla:", {
              name: env.WA_TEMPLATE_NAME,
              lang: env.WA_TEMPLATE_LANG,
              hasHeaderVideo: headerParams.length > 0,
              bodyVars: bodyParams.length,
            });

            await waSendTemplate(from, env.WA_TEMPLATE_NAME, env.WA_TEMPLATE_LANG, components);
            console.log("[WA] Plantilla enviada OK");
          } catch (err: any) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            console.error("[WA] Error enviando plantilla:", status, data || err?.message);
            console.error(
              "[WA] Tips: Verificá que el nombre/idioma coincidan EXACTO y que el header de VIDEO se esté enviando (MEDIA_ID o URL .mp4)."
            );
          }
        } else {
          // Ejemplos: image, location, interactive, etc.
          console.log(`ℹ️ Tipo de mensaje no manejado (${type}).`);
        }
      }
    }

    // ✅ 2) Status de mensajes (entregado, leído, etc.)
    const statuses = value?.statuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      for (const st of statuses) {
        console.log("📦 Status entrante:", st);
        // st.status puede ser 'sent', 'delivered', 'read', 'failed', etc.
      }
    }

    // Siempre responder 200 para evitar reintentos innecesarios
    res.sendStatus(200);
  } catch (err) {
    console.error("[WA] webhook error:", err);
    res.sendStatus(500);
  }
}
