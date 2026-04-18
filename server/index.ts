import "dotenv/config";
import "./discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import type { OrderPayload } from "../shared/types.js";
import { sendOrderFile } from "./discord.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(cors());
app.use(express.json({ limit: "512kb" }));

if (isProd) {
  const staticDir = path.join(__dirname, "../dist/client");
  app.use(express.static(staticDir));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, discordReady: globalThis.__discordReady === true });
});

app.post("/api/order", async (req, res) => {
  if (!globalThis.__discordReady) {
    res.status(503).json({
      error:
        "Бот Discord ещё не готов. Проверьте DISCORD_BOT_TOKEN и права бота.",
    });
    return;
  }

  const body = req.body as Partial<OrderPayload>;
  const buyerRpName = String(body.buyerRpName ?? "").trim();
  const discordHandle = String(body.discordHandle ?? "").trim();
  const deliveryNote = String(body.deliveryNote ?? "").trim();
  const lines = Array.isArray(body.lines) ? body.lines : [];

  if (!buyerRpName || buyerRpName.length > 120) {
    res.status(400).json({
      error: "Укажите имя в РП (не более 120 символов).",
    });
    return;
  }
  if (lines.length === 0) {
    res.status(400).json({ error: "Корзина пуста." });
    return;
  }

  const normalized = lines.map((l) => ({
    productId: String(l.productId ?? ""),
    name: String(l.name ?? "").slice(0, 200),
    qty: Math.min(99, Math.max(1, Math.floor(Number(l.qty) || 0))),
    unitPriceDm: Math.max(0, Number(l.unitPriceDm) || 0),
  }));

  for (const l of normalized) {
    if (!l.productId || !l.name) {
      res.status(400).json({ error: "Некорректные позиции в корзине." });
      return;
    }
  }

  const payload: OrderPayload = {
    buyerRpName,
    discordHandle,
    deliveryNote,
    lines: normalized,
  };

  try {
    await sendOrderFile(payload);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Не удалось отправить заказ в Discord." });
  }
});

if (isProd) {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist/client/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API и магазин: http://127.0.0.1:${PORT}`);
});
