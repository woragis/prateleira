import { requireRole } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { createLotAction } from "@/actions/catalog";
import { formatBRL } from "@/lib/money";

export default async function LotsPage() {
  await requireRole(["OWNER", "MANAGER"]);
  const shopId = await resolveActiveShopId();
  if (!shopId) return <p>Selecione uma loja.</p>;

  const [lots, products] = await Promise.all([
    prisma.lot.findMany({
      where: { product: { shopId }, quantity: { gt: 0 } },
      include: { product: true },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.product.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Lotes</h1>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Qtd</th>
              <th className="px-4 py-3">Custo</th>
              <th className="px-4 py-3">Validade</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id} className="border-b border-border/60">
                <td className="px-4 py-3">{l.product.name}</td>
                <td className="px-4 py-3">{l.quantity}</td>
                <td className="px-4 py-3">{formatBRL(l.costCents)}</td>
                <td className="px-4 py-3">
                  {l.expiresAt
                    ? l.expiresAt.toLocaleDateString("pt-BR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={createLotAction} className="grid max-w-md gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Entrada de lote</h2>
        <select name="productId" required className="rounded-xl border px-3 py-2 text-sm" defaultValue="">
          <option value="" disabled>
            Produto
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="quantity" type="number" min={1} required placeholder="Quantidade" className="rounded-xl border px-3 py-2 text-sm" />
        <input name="cost" placeholder="Custo unitário (opcional)" className="rounded-xl border px-3 py-2 text-sm" />
        <input name="expiresAt" type="date" className="rounded-xl border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm text-white">
          Registrar entrada
        </button>
      </form>
    </div>
  );
}
