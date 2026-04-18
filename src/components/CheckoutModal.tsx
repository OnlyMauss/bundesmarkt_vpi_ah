import { products } from "@shared/catalog";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CheckoutModal({ open, onClose }: Props) {
  const { lines, clear } = useCart();
  const [buyerRpName, setBuyerRpName] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">(
    "idle",
  );
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setErrMsg("");
    }
  }, [open]);

  const payloadLines = useMemo(() => {
    return lines.map((l) => {
      const p = products.find((x) => x.id === l.productId);
      return {
        productId: l.productId,
        name: p?.name ?? l.productId,
        qty: l.qty,
        unitPriceDm: p?.priceDm ?? 0,
      };
    });
  }, [lines]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerRpName: buyerRpName.trim(),
          discordHandle: discordHandle.trim(),
          deliveryNote: deliveryNote.trim(),
          lines: payloadLines,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setStatus("err");
        setErrMsg(data.error ?? "Неизвестная ошибка");
        return;
      }
      setStatus("ok");
      clear();
      setBuyerRpName("");
      setDiscordHandle("");
      setDeliveryNote("");
    } catch {
      setStatus("err");
      setErrMsg("Ошибка сети — сервер доступен?");
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="checkout-title">Отправить заказ</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            Закрыть
          </button>
        </div>

        {status === "ok" ? (
          <p className="success-msg">
            Заказ передан боту Discord. Файл заказа (.txt) придёт в
            настроенный канал или в личные сообщения.
          </p>
        ) : (
          <form className="checkout-form" onSubmit={onSubmit}>
            <label>
              Имя покупателя в РП *
              <input
                required
                maxLength={120}
                value={buyerRpName}
                onChange={(e) => setBuyerRpName(e.target.value)}
                placeholder="Например: доктор Клаус Бреннер"
              />
            </label>
            <label>
              Контакт в Discord (необязательно)
              <input
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                placeholder="Например: @никнейм"
              />
            </label>
            <label>
              Доставка / адрес в РП
              <textarea
                rows={4}
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Пункт выдачи, перевозчик, дипломатическая доставка…"
              />
            </label>

            {status === "err" && (
              <p className="error-msg" role="alert">
                {errMsg}
              </p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                disabled={status === "sending"}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={lines.length === 0 || status === "sending"}
              >
                {status === "sending"
                  ? "Отправка…"
                  : "Отправить .txt в Discord"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
