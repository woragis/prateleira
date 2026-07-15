import { requireRole } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { createCategoryAction, deleteCategoryAction } from "@/actions/catalog";

export default async function CategoriesPage() {
  await requireRole(["OWNER", "MANAGER"]);
  const shopId = await resolveActiveShopId();
  if (!shopId) return <p>Selecione uma loja.</p>;

  const categories = await prisma.category.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Categorias</h1>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <span>{c.name}</span>
            <form
              action={async () => {
                "use server";
                await deleteCategoryAction(c.id);
              }}
            >
              <button type="submit" className="text-sm text-danger">
                Excluir
              </button>
            </form>
          </li>
        ))}
      </ul>
      <form action={createCategoryAction} className="flex max-w-md gap-2">
        <input
          name="name"
          required
          placeholder="Nova categoria"
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm text-white">
          Criar
        </button>
      </form>
    </div>
  );
}
