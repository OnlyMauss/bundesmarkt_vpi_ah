import { categories, companies, productTypes } from "@shared/catalog";

type Props = {
  categoryId: string;
  onCategory: (id: string) => void;
  companyId: string | null;
  onCompany: (id: string | null) => void;
  typeId: string | null;
  onType: (id: string | null) => void;
};

export function SidebarFilters({
  categoryId,
  onCategory,
  companyId,
  onCompany,
  typeId,
  onType,
}: Props) {
  const catCompanies = companies
    .filter((c) => c.categoryId === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const catTypes = productTypes
    .filter((t) => t.categoryId === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return (
    <aside className="sidebar">
      <section className="panel">
        <h2 className="panel-title">Раздел</h2>
        <ul className="filter-list">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={
                  c.id === categoryId ? "filter-btn active" : "filter-btn"
                }
                onClick={() => {
                  onCategory(c.id);
                  onCompany(null);
                  onType(null);
                }}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="panel-hint">
          {categories.find((x) => x.id === categoryId)?.description}
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">Компания / бренд</h2>
        <ul className="filter-list compact">
          <li>
            <button
              type="button"
              className={companyId === null ? "filter-btn active" : "filter-btn"}
              onClick={() => onCompany(null)}
            >
              Все
            </button>
          </li>
          {catCompanies.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={
                  c.id === companyId ? "filter-btn active" : "filter-btn"
                }
                onClick={() => onCompany(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-title">Тип товара</h2>
        <ul className="filter-list compact">
          <li>
            <button
              type="button"
              className={typeId === null ? "filter-btn active" : "filter-btn"}
              onClick={() => onType(null)}
            >
              Все
            </button>
          </li>
          {catTypes.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={t.id === typeId ? "filter-btn active" : "filter-btn"}
                onClick={() => onType(t.id)}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
