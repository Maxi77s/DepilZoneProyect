// src/integrations/whatsapp/wa.boot.ts
import { env } from "../config/env";

export function logWhatsAppBootInfo() {
  const token = env.WHATSAPP_TOKEN || "";
  const last6 = token.slice(-6);

  console.log("----------- WhatsApp Cloud API -----------");
  console.log("[WA] WABA_ID:           ", env.WABA_ID);
  console.log("[WA] PHONE_NUMBER_ID:   ", env.PHONE_NUMBER_ID);
  console.log("[WA] VERIFY_TOKEN:      ", env.VERIFY_TOKEN);
  console.log("[WA] TOKEN last6:       ", last6 || "(sin token)");
  console.log("------------------------------------------");
}
