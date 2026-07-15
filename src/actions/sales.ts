"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrgAccess } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { debitLotsFifo } from "@/lib/stock";

const checkoutSchema = z.object({
  paymentMethod: z.enum(["CASH", "PIX", "CARD"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function checkoutSaleAction(payload: {
  paymentMethod: "CASH" | "PIX" | "CARD";
  items: { productId: string; qty: number }[];
}) {
  const { session, org } = await requireOrgAccess();
  const shopId = await resolveActiveShopId();
  if (!shopId) throw new Error("Nenhuma loja selecionada");

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, organizationId: org.id },
  });
  if (!shop) throw new Error("Loja inválida");

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Carrinho inválido");

  const sale = await prisma.$transaction(async (tx) => {
    let totalCents = 0;
    const lineData: {
      productId: string;
      qty: number;
      unitPriceCents: number;
      unitCostCents: number;
    }[] = [];

    for (const item of parsed.data.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, shopId },
      });
      if (!product) throw new Error("Produto não encontrado");

      const unitCostCents = await debitLotsFifo(tx, product.id, item.qty);
      totalCents += product.priceCents * item.qty;
      lineData.push({
        productId: product.id,
        qty: item.qty,
        unitPriceCents: product.priceCents,
        unitCostCents,
      });
    }

    return tx.sale.create({
      data: {
        shopId,
        userId: session.user.id,
        totalCents,
        paymentMethod: parsed.data.paymentMethod,
        items: { create: lineData },
      },
      include: { items: true },
    });
  });

  revalidatePath("/app/pos");
  revalidatePath("/app/sales");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/lots");
  return { saleId: sale.id, totalCents: sale.totalCents };
}
