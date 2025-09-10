// src/integrations/whatsapp/whatsapp.controller.ts
import type { Request, Response } from "express";
import { env } from "../config/env";           
import { waSendText } from "./whatsapp.service";

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
