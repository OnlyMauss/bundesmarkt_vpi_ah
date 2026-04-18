import {
  AttachmentBuilder,
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import type { OrderPayload } from "../shared/types.js";

declare global {
  // eslint-disable-next-line no-var
  var __discordReady: boolean | undefined;
}

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_ORDER_CHANNEL_ID?.trim();
const ownerUserId = process.env.DISCORD_OWNER_USER_ID?.trim();

function formatOrderTxt(p: OrderPayload): string {
  const now = new Date();
  const lines = p.lines.map((l, i) => {
    const sum = (l.unitPriceDm * l.qty).toFixed(2);
    return [
      `${i + 1}. ${l.name}`,
      `   Артикул/ID: ${l.productId}`,
      `   Кол-во: ${l.qty} × ${l.unitPriceDm.toFixed(2)} DM = ${sum} DM`,
    ].join("\n");
  });

  const subtotal = p.lines.reduce(
    (a, l) => a + l.unitPriceDm * l.qty,
    0,
  );

  return [
    "══════════════════════════════════════",
    "  VPI РЫНОК — ЗАКАЗ (1992, АИ)",
    "══════════════════════════════════════",
    `Время (ISO): ${now.toISOString()}`,
    "",
    "ПОКУПАТЕЛЬ (РП)",
    `  Имя: ${p.buyerRpName}`,
    p.discordHandle ? `  Discord: ${p.discordHandle}` : "  Discord: —",
    "",
    "ДОСТАВКА / АДРЕС (РП)",
    p.deliveryNote || "  —",
    "",
    "ПОЗИЦИИ",
    ...lines,
    "",
    `ИТОГО: ${subtotal.toFixed(2)} DM`,
    "(цены условные — РП-каталог)",
    "",
    "Конец заказа",
  ].join("\n");
}

export const discordClient = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

discordClient.once("ready", () => {
  globalThis.__discordReady = true;
  console.log(`Discord: вошли как ${discordClient.user?.tag}`);
});

discordClient.on("error", console.error);

export async function sendOrderFile(payload: OrderPayload): Promise<void> {
  const text = formatOrderTxt(payload);
  const filename = `vpi-zakaz-${Date.now()}.txt`;
  const file = new AttachmentBuilder(Buffer.from(text, "utf8"), {
    name: filename,
  });

  const summary = [
    "**Новый заказ на рынке (1992)**",
    `Имя в РП: **${payload.buyerRpName.replace(/[*`_]/g, "")}**`,
    payload.discordHandle
      ? `Discord: ${payload.discordHandle.replace(/[*`_]/g, "")}`
      : "",
    `Позиций: ${payload.lines.length}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (channelId) {
    const ch = await discordClient.channels.fetch(channelId);
    if (!ch || !ch.isSendable()) {
      throw new Error(
        "Неверный DISCORD_ORDER_CHANNEL_ID или нельзя писать в канал.",
      );
    }
    await ch.send({ content: summary, files: [file] });
    return;
  }

  if (ownerUserId) {
    const user = await discordClient.users.fetch(ownerUserId);
    await user.send({ content: summary, files: [file] });
    return;
  }

  throw new Error(
    "Укажите в .env DISCORD_ORDER_CHANNEL_ID или DISCORD_OWNER_USER_ID",
  );
}

if (token) {
  discordClient.login(token).catch((e) => {
    console.error("Ошибка входа Discord:", e);
  });
} else {
  console.warn(
    "Нет DISCORD_BOT_TOKEN — заказы в Discord отправлять нельзя.",
  );
}
