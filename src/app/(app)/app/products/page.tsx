import { requireRole } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { createProductAction, deleteProductAction } from "@/actions/catalog";
import { formatBRL, marginPercent } from "@/lib/money";

export default async function ProductsPage() {
  await requireRole(["OWNER", "MANAGER"]);
  const shopId = await resolveActiveShopId();
  if (!shopId) return <p>Selecione uma loja.</p>;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { shopId },
      include: { category: true, lots: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Produtos</h1>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Margem</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.lots.reduce((a, l) => a + l.quantity, 0);
              return (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-background" />
                      )}
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted">
                          {p.category?.name || "Sem categoria"}
                          {p.sku ? ` · ${p.sku}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatBRL(p.priceCents)}</td>
                  <td className="px-4 py-3">
                    {marginPercent(p.costCents, p.priceCents)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={stock <= p.minStock ? "text-danger" : ""}>
                      {stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteProductAction(p.id);
                      }}
                    >
                      <button type="submit" className="text-danger">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form
        action={createProductAction}
        encType="multipart/form-data"
        className="grid max-w-xl gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-display text-xl">Novo produto</h2>
        <input name="name" required placeholder="Nome" className="rounded-xl border px-3 py-2 text-sm" />
        <input name="sku" placeholder="SKU" className="rounded-xl border px-3 py-2 text-sm" />
        <select name="categoryId" className="rounded-xl border px-3 py-2 text-sm" defaultValue="">
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input name="cost" required placeholder="Custo (ex 2,50)" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="price" required placeholder="Preço venda" className="rounded-xl border px-3 py-2 text-sm" />
        </div>
        <input name="minStock" type="number" defaultValue={5} className="rounded-xl border px-3 py-2 text-sm" />
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm text-white">
          Salvar produto
        </button>
      </form>
    </div>
  );
}
