import { companies, productTypes } from "@shared/catalog";
import type { Product } from "@shared/types";
import { useCart } from "../context/CartContext";

type Props = {
  products: Product[];
};

export function ProductGrid({ products: list }: Props) {
  const { add } = useCart();

  if (list.length === 0) {
    return (
      <div className="empty-state">
        <p>Нет товаров при таких фильтрах.</p>
        <p className="muted">
          Сбросьте фильтры или выберите другой раздел.
        </p>
      </div>
    );
  }

  return (
    <div className="grid">
      {list.map((p) => {
        const co = companies.find((c) => c.id === p.companyId);
        const ty = productTypes.find((t) => t.id === p.typeId);
        return (
          <article key={p.id} className="card">
            <div className="card-top">
              <span className="card-sku">{p.sku}</span>
              {p.yearModel && (
                <span className="card-year">Модель {p.yearModel}</span>
              )}
            </div>
            <h3 className="card-title">{p.name}</h3>
            <p className="card-meta">
              {co?.name}
              {ty ? ` · ${ty.name}` : ""}
            </p>
            <p className="card-details">{p.details}</p>
            <div className="card-footer">
              <span className="price">
                {p.priceDm.toLocaleString("ru-RU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                DM
              </span>
              <button
                type="button"
                className="btn-primary"
                onClick={() => add(p.id, 1)}
              >
                В корзину
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
