"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { uploadProductImage } from "@/lib/upload";
import { parseMoneyToCents } from "@/lib/money";

async function shopContext() {
  const ctx = await requireRole(["OWNER", "MANAGER"]);
  const shopId = await resolveActiveShopId();
  if (!shopId) throw new Error("Nenhuma loja selecionada");
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, organizationId: ctx.org.id },
  });
  if (!shop) throw new Error("Loja inválida");
  return { ...ctx, shop };
}

export async function createCategoryAction(formData: FormData) {
  const { shop } = await shopContext();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Nome obrigatório");
  await prisma.category.create({ data: { shopId: shop.id, name } });
  revalidatePath("/app/categories");
  revalidatePath("/app/products");
}

export async function deleteCategoryAction(id: string) {
  const { shop } = await shopContext();
  await prisma.category.deleteMany({ where: { id, shopId: shop.id } });
  revalidatePath("/app/categories");
}

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  cost: z.string(),
  price: z.string(),
  minStock: z.coerce.number().int().min(0).default(5),
});

export async function createProductAction(formData: FormData) {
  const { shop } = await shopContext();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    cost: formData.get("cost"),
    price: formData.get("price"),
    minStock: formData.get("minStock") || 5,
  });
  if (!parsed.success) throw new Error("Dados do produto inválidos");

  let imageUrl: string | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    imageUrl = await uploadProductImage(file);
  }

  await prisma.product.create({
    data: {
      shopId: shop.id,
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      categoryId: parsed.data.categoryId || null,
      costCents: parseMoneyToCents(parsed.data.cost),
      priceCents: parseMoneyToCents(parsed.data.price),
      minStock: parsed.data.minStock,
      imageUrl: imageUrl || null,
    },
  });
  revalidatePath("/app/products");
  revalidatePath("/app/pos");
}

export async function updateProductAction(formData: FormData) {
  const { shop } = await shopContext();
  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    cost: formData.get("cost"),
    price: formData.get("price"),
    minStock: formData.get("minStock") || 5,
  });
  if (!parsed.success || !id) throw new Error("Dados inválidos");

  const existing = await prisma.product.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) throw new Error("Produto não encontrado");

  let imageUrl = existing.imageUrl;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    imageUrl = await uploadProductImage(file);
  }

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      categoryId: parsed.data.categoryId || null,
      costCents: parseMoneyToCents(parsed.data.cost),
      priceCents: parseMoneyToCents(parsed.data.price),
      minStock: parsed.data.minStock,
      imageUrl,
    },
  });
  revalidatePath("/app/products");
}

export async function deleteProductAction(id: string) {
  const { shop } = await shopContext();
  await prisma.product.deleteMany({ where: { id, shopId: shop.id } });
  revalidatePath("/app/products");
}

export async function createLotAction(formData: FormData) {
  const { shop } = await shopContext();
  const productId = String(formData.get("productId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const cost = String(formData.get("cost") || "0");
  const expiresAtRaw = String(formData.get("expiresAt") || "");

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id },
  });
  if (!product) throw new Error("Produto inválido");
  if (quantity <= 0) throw new Error("Quantidade inválida");

  await prisma.lot.create({
    data: {
      productId,
      quantity,
      costCents: parseMoneyToCents(cost) || product.costCents,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    },
  });
  revalidatePath("/app/lots");
  revalidatePath("/app/products");
  revalidatePath("/app/dashboard");
}
