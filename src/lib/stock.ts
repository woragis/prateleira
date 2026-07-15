import type { Lot, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Decrement lots FIFO by earliest expiry (nulls last). Returns average unit cost of taken qty. */
export async function debitLotsFifo(
  tx: Tx,
  productId: string,
  qty: number,
): Promise<number> {
  const lots = await tx.lot.findMany({
    where: { productId, quantity: { gt: 0 } },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });

  const ordered = [
    ...lots.filter((l: Lot) => l.expiresAt !== null),
    ...lots.filter((l: Lot) => l.expiresAt === null),
  ];

  let remaining = qty;
  let costAcc = 0;
  let taken = 0;

  for (const lot of ordered) {
    if (remaining <= 0) break;
    const take = Math.min(lot.quantity, remaining);
    await tx.lot.update({
      where: { id: lot.id },
      data: { quantity: lot.quantity - take },
    });
    costAcc += lot.costCents * take;
    taken += take;
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Estoque insuficiente");
  }

  return taken > 0 ? Math.round(costAcc / taken) : 0;
}

export async function sumStock(
  tx: Tx | typeof import("@/lib/db").prisma,
  productId: string,
): Promise<number> {
  const agg = await tx.lot.aggregate({
    where: { productId, quantity: { gt: 0 } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
