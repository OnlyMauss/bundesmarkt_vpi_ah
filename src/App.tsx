import { useMemo, useState } from "react";
import {
  categories,
  companies,
  productTypes,
  products,
} from "@shared/catalog";
import type { Product } from "@shared/types";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { Header } from "./components/Header";
import { ProductGrid } from "./components/ProductGrid";
import { SidebarFilters } from "./components/SidebarFilters";

export default function App() {
  const [categoryId, setCategoryId] = useState<string>(categories[0]!.id);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p: Product) => {
      if (p.categoryId !== categoryId) return false;
      if (companyId && p.companyId !== companyId) return false;
      if (typeId && p.typeId !== typeId) return false;
      if (!q) return true;
      const c = companies.find((x) => x.id === p.companyId);
      const t = productTypes.find((x) => x.id === p.typeId);
      const blob = `${p.name} ${p.sku} ${p.details} ${c?.name ?? ""} ${t?.name ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [categoryId, companyId, typeId, query]);

  return (
    <div className="layout">
      <Header
        query={query}
        onQuery={setQuery}
        onOpenCart={() => setCartOpen(true)}
      />

      <div className="layout-main">
        <SidebarFilters
          categoryId={categoryId}
          onCategory={setCategoryId}
          companyId={companyId}
          onCompany={setCompanyId}
          typeId={typeId}
          onType={setTypeId}
        />
        <main className="content">
          <ProductGrid products={filtered} />
        </main>
      </div>

      <footer className="footer">
        <p>
          Рынок VPI — каталог альтернативной истории, весна 1992 года. Цены в
          немецких марках (DM), доставка по договорённости в РП.
        </p>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
