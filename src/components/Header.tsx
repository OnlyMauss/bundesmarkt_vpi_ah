import { useCart } from "../context/CartContext";

type Props = {
  query: string;
  onQuery: (q: string) => void;
  onOpenCart: () => void;
};

export function Header({ query, onQuery, onOpenCart }: Props) {
  const { count } = useCart();

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            VPI
          </div>
          <div>
            <div className="brand-title">Федеральный рынок</div>
            <div className="brand-sub">Выпуск каталога 1992 · АИ</div>
          </div>
        </div>

        <label className="search">
          <span className="sr-only">Поиск</span>
          <input
            type="search"
            placeholder="Товар, производитель, ключевое слово…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>

        <button type="button" className="cart-btn" onClick={onOpenCart}>
          <span className="cart-btn-label">Корзина</span>
          {count > 0 && <span className="cart-badge">{count}</span>}
        </button>
      </div>
    </header>
  );
}
