// src/integrations/whatsapp/whatsapp.routes.ts
import { Router } from "express";
import { receiveWebhook, verifyWebhook } from "./whatsapp.controller";

const router = Router();

// Meta verifica con GET y envía eventos por POST
router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWebhook);

// Ruta opcional para pruebas de envío manual (curl/postman)
router.post("/send-text", async (req, res) => {
  // body: { to: "549351XXXXXXX", message: "hola" }
  try {
    const { to, message } = req.body;
    // import inline para evitar ciclos
    const { waSendText } = await import("./whatsapp.service");
    await waSendText(to, message);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

export default router;
