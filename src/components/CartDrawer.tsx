import { products } from "@shared/catalog";
import { useMemo } from "react";
import { useCart } from "../context/CartContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export function CartDrawer({ open, onClose, onCheckout }: Props) {
  const { lines, setQty, remove, clear } = useCart();

  const rows = useMemo(() => {
    return lines.map((l) => {
      const p = products.find((x) => x.id === l.productId);
      return { line: l, product: p };
    });
  }, [lines]);

  const total = useMemo(() => {
    return rows.reduce((a, r) => {
      if (!r.product) return a;
      return a + r.product.priceDm * r.line.qty;
    }, 0);
  }, [rows]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <h2 id="cart-title">Корзина</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            Закрыть
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="drawer-empty">Корзина пока пуста.</p>
        ) : (
          <>
            <ul className="cart-lines">
              {rows.map(({ line, product }) => (
                <li key={line.productId} className="cart-line">
                  <div className="cart-line-info">
                    <strong>{product?.name ?? line.productId}</strong>
                    <span className="muted small">
                      {product
                        ? `${product.priceDm.toFixed(2)} DM за шт.`
                        : ""}
                    </span>
                  </div>
                  <div className="cart-line-actions">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={line.qty}
                      onChange={(e) =>
                        setQty(line.productId, Number(e.target.value))
                      }
                      aria-label="Количество"
                    />
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => remove(line.productId)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <div className="total-row">
                <span>Промежуточный итог</span>
                <strong>
                  {total.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  DM
                </strong>
              </div>
              <div className="drawer-actions">
                <button type="button" className="btn-ghost" onClick={clear}>
                  Очистить корзину
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onCheckout}
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
