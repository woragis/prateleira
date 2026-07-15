import { requireOrgAccess } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { addDays, startOfDay } from "date-fns";
import Link from "next/link";

export default async function DashboardPage() {
  const { org } = await requireOrgAccess();
  const shopId = await resolveActiveShopId();

  if (!shopId) {
    return (
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-2 text-muted">
          Crie uma loja em{" "}
          <Link href="/app/shops" className="text-brand underline">
            Lojas
          </Link>
          .
        </p>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const week = addDays(today, 7);

  const [salesToday, products, lowStock, expiringLots] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: today } },
    }),
    prisma.product.findMany({
      where: { shopId },
      include: { lots: { where: { quantity: { gt: 0 } } } },
    }),
    prisma.product.findMany({
      where: { shopId },
      include: { lots: true },
    }),
    prisma.lot.findMany({
      where: {
        product: { shopId },
        quantity: { gt: 0 },
        expiresAt: { gte: today, lte: week },
      },
      include: { product: true },
      orderBy: { expiresAt: "asc" },
      take: 10,
    }),
  ]);

  const revenue = salesToday.reduce((s, x) => s + x.totalCents, 0);
  const byPay = {
    CASH: 0,
    PIX: 0,
    CARD: 0,
  };
  for (const s of salesToday) byPay[s.paymentMethod] += s.totalCents;

  const low = lowStock.filter((p) => {
    const stock = p.lots.reduce((a, l) => a + l.quantity, 0);
    return stock <= p.minStock;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-muted">{org.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Vendas hoje" value={formatBRL(revenue)} />
        <Stat label="Tickets" value={String(salesToday.length)} />
        <Stat label="Produtos" value={String(products.length)} />
        <Stat label="Estoque baixo" value={String(low.length)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Dinheiro" value={formatBRL(byPay.CASH)} />
        <Stat label="PIX" value={formatBRL(byPay.PIX)} />
        <Stat label="Cartão" value={formatBRL(byPay.CARD)} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Estoque baixo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {low.length === 0 && <li className="text-muted">Nenhum alerta</li>}
            {low.slice(0, 8).map((p) => {
              const stock = p.lots.reduce((a, l) => a + l.quantity, 0);
              return (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-danger">
                    {stock} / mín {p.minStock}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Validade (7 dias)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {expiringLots.length === 0 && (
              <li className="text-muted">Nenhum lote próximo</li>
            )}
            {expiringLots.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span>{l.product.name}</span>
                <span className="text-accent">
                  {l.quantity} un · {l.expiresAt?.toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
