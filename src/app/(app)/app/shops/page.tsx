import { requireRole } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { createShopAction } from "@/actions/shops";

export default async function ShopsPage() {
  const { org } = await requireRole(["OWNER"]);
  const shops = await prisma.shop.findMany({
    where: { organizationId: org.id },
    orderBy: { name: "asc" },
  });
  const active = await resolveActiveShopId();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Lojas</h1>
      <ul className="space-y-2">
        {shops.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-muted">/{s.slug}</div>
            </div>
            {active === s.id && (
              <span className="text-xs text-ok">ativa</span>
            )}
          </li>
        ))}
      </ul>

      <form action={createShopAction} className="max-w-md space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Nova loja</h2>
        <input
          name="name"
          required
          placeholder="Nome"
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm text-white">
          Criar
        </button>
      </form>
    </div>
  );
}
