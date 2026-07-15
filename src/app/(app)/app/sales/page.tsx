import { requireOrgAccess } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";

export default async function SalesPage() {
  await requireOrgAccess();
  const shopId = await resolveActiveShopId();
  if (!shopId) return <p>Selecione uma loja.</p>;

  const sales = await prisma.sale.findMany({
    where: { shopId },
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const payLabel = { CASH: "Dinheiro", PIX: "PIX", CARD: "Cartão" } as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Vendas</h1>
      <ul className="space-y-3">
        {sales.length === 0 && (
          <li className="text-sm text-muted">Nenhuma venda ainda.</li>
        )}
        {sales.map((s) => (
          <li key={s.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{formatBRL(s.totalCents)}</div>
                <div className="text-sm text-muted">
                  {s.createdAt.toLocaleString("pt-BR")} · {s.user.name} ·{" "}
                  {payLabel[s.paymentMethod]}
                </div>
              </div>
              <div className="text-xs text-muted">#{s.id.slice(-8)}</div>
            </div>
            <ul className="mt-2 text-sm text-muted">
              {s.items.map((i) => (
                <li key={i.id}>
                  {i.qty}× {i.product.name} — {formatBRL(i.unitPriceCents * i.qty)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
