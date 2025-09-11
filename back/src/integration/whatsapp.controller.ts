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

    // 1) Mensajes entrantes
    const messages = value?.messages;
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const from: string = msg.from;
        const type: string = msg.type;

        if (type !== "text") continue;

        const text = (msg.text?.body ?? "").trim().toLowerCase();

        // Respuesta simple
        let reply = "Escribe 'menu' para ver opciones.";
        if (text === "hola") reply = "¡Hola! Soy tu bot 🤖";
        if (text === "menu") reply = "Opciones:\n1) estado\n2) ayuda";

        try {
          await waSendText(from, reply);
        } catch (e) {
          // silencioso: no bloquea el resto del flujo
        }

        // 2) Envío de plantilla (SOLO agrega componentes si hay env válidas)
        try {
          type TemplateParam =
            | { type: "text"; text: string }
            | { type: "video"; video: { link: string } };

          const components: any[] = [];

          // HEADER: video por link .mp4 público
          const videoUrl = env.WA_TEMPLATE_VIDEO_URL?.trim();
          if (videoUrl && /\.mp4(\?.*)?$/.test(videoUrl)) {
            const headerParams: TemplateParam[] = [
              { type: "video", video: { link: videoUrl } },
            ];
            components.push({ type: "header", parameters: headerParams });
          }

          // BODY: solo si hay vars (y tu plantilla las tiene)
          const bodyTitle = env.WA_TEMPLATE_BODY_TITLE?.trim();
          const bodyMessage = env.WA_TEMPLATE_BODY_MESSAGE?.trim();
          if (bodyTitle || bodyMessage) {
            const bodyParams: TemplateParam[] = [];
            if (bodyTitle) bodyParams.push({ type: "text", text: bodyTitle });
            if (bodyMessage) bodyParams.push({ type: "text", text: bodyMessage });
            components.push({ type: "body", parameters: bodyParams });
          }

          // BOTÓN URL dinámico: solo si tu plantilla tiene {{1}} en el botón
          const btnSuffix = env.WA_TEMPLATE_BTN_SUFFIX?.trim();
          if (btnSuffix) {
            components.push({
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: btnSuffix }],
            });
          }

          // Si no hay ningún componente, igual se puede enviar la plantilla estática
          await waSendTemplate(
            from,
            env.WA_TEMPLATE_NAME,
            env.WA_TEMPLATE_LANG,
            components
          );
        } catch {
          // si falla la plantilla no cortamos la respuesta del webhook
        }
      }
    }

    // 3) Status entrantes (sent, delivered, read, failed). No hacemos nada activo.
    // const statuses = value?.statuses; // opcional: registrar métricas si querés

    // Siempre 200 para que Meta no reintente
    res.sendStatus(200);
  } catch {
    res.sendStatus(200); // seguimos respondiendo 200 para evitar reintentos
  }
}
