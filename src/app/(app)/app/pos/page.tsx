import { requireOrgAccess } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { prisma } from "@/lib/db";
import { PosClient } from "@/components/pos-client";

export default async function PosPage() {
  await requireOrgAccess();
  const shopId = await resolveActiveShopId();
  if (!shopId) return <p>Selecione uma loja.</p>;

  const products = await prisma.product.findMany({
    where: { shopId },
    include: { lots: true },
    orderBy: { name: "asc" },
  });

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    stock: p.lots.reduce((a, l) => a + l.quantity, 0),
  }));

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">PDV</h1>
      <PosClient products={mapped} />
    </div>
  );
}
