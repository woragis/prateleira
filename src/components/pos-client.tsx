"use client";

import { useMemo, useState, useTransition } from "react";
import { checkoutSaleAction } from "@/actions/sales";
import { formatBRL } from "@/lib/money";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
};

export function PosClient({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const lines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const p = products.find((x) => x.id === id)!;
        return { ...p, qty, lineTotal: p.priceCents * qty };
      });
  }, [cart, products]);

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);

  function add(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p || p.stock <= 0) return;
    setCart((c) => {
      const next = (c[id] || 0) + 1;
      if (next > p.stock) return c;
      return { ...c, [id]: next };
    });
  }

  function dec(id: string) {
    setCart((c) => {
      const next = (c[id] || 0) - 1;
      if (next <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: next };
    });
  }

  function pay(method: "CASH" | "PIX" | "CARD") {
    if (lines.length === 0) return;
    setMessage(null);
    start(async () => {
      try {
        const result = await checkoutSaleAction({
          paymentMethod: method,
          items: lines.map((l) => ({ productId: l.id, qty: l.qty })),
        });
        setCart({});
        setMessage(`Venda ${result.saleId.slice(-6)} — ${formatBRL(result.totalCents)}`);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Erro na venda");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto…"
          className="mb-4 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p.id)}
              disabled={p.stock <= 0}
              className="rounded-2xl border border-border bg-card p-3 text-left hover:border-brand disabled:opacity-40"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="mb-2 h-24 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mb-2 flex h-24 items-center justify-center rounded-xl bg-background text-sm text-muted">
                  Sem foto
                </div>
              )}
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted">
                {formatBRL(p.priceCents)} · estoque {p.stock}
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4">
        <h2 className="font-display text-xl">Carrinho</h2>
        <ul className="mt-4 space-y-3">
          {lines.length === 0 && (
            <li className="text-sm text-muted">Nenhum item</li>
          )}
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-muted">{formatBRL(l.lineTotal)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => dec(l.id)} className="rounded border px-2">
                  −
                </button>
                <span>{l.qty}</span>
                <button type="button" onClick={() => add(l.id)} className="rounded border px-2">
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4 text-lg font-semibold">
          Total {formatBRL(total)}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["CASH", "PIX", "CARD"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={pending || lines.length === 0}
              onClick={() => pay(m)}
              className="rounded-xl bg-brand px-2 py-2.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {m === "CASH" ? "Dinheiro" : m === "PIX" ? "PIX" : "Cartão"}
            </button>
          ))}
        </div>
        {message && <p className="mt-3 text-sm text-ok">{message}</p>}
      </aside>
    </div>
  );
}
