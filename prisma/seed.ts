import "dotenv/config";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const forceActive = process.env.SEED_FORCE_ACTIVE === "1";

  const owner = await prisma.user.create({
    data: {
      name: "Dono Demo",
      email: "dono@prateleira.app",
      passwordHash,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "Caixa Demo",
      email: "caixa@prateleira.app",
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Mercado Esperança",
      slug: "mercado-esperanca",
      trialEndsAt: addDays(new Date(), 14),
      plan: forceActive ? "ESSENCIAL" : "NONE",
      subscriptionStatus: forceActive ? "ACTIVE" : "TRIALING",
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: "OWNER" },
      { userId: cashier.id, organizationId: org.id, role: "CASHIER" },
    ],
  });

  const shop = await prisma.shop.create({
    data: {
      organizationId: org.id,
      name: "Loja Centro",
      slug: "centro",
    },
  });

  const catMercearia = await prisma.category.create({
    data: { shopId: shop.id, name: "Mercearia" },
  });
  const catLaticinios = await prisma.category.create({
    data: { shopId: shop.id, name: "Laticínios" },
  });

  const arroz = await prisma.product.create({
    data: {
      shopId: shop.id,
      categoryId: catMercearia.id,
      name: "Arroz 5kg",
      sku: "ARZ-5",
      costCents: 1800,
      priceCents: 2490,
      minStock: 10,
    },
  });
  const feijao = await prisma.product.create({
    data: {
      shopId: shop.id,
      categoryId: catMercearia.id,
      name: "Feijão 1kg",
      sku: "FEJ-1",
      costCents: 650,
      priceCents: 990,
      minStock: 15,
    },
  });
  const leite = await prisma.product.create({
    data: {
      shopId: shop.id,
      categoryId: catLaticinios.id,
      name: "Leite 1L",
      sku: "LEI-1",
      costCents: 380,
      priceCents: 549,
      minStock: 20,
    },
  });

  await prisma.lot.createMany({
    data: [
      {
        productId: arroz.id,
        quantity: 40,
        costCents: 1800,
        expiresAt: addDays(new Date(), 180),
      },
      {
        productId: feijao.id,
        quantity: 25,
        costCents: 650,
        expiresAt: addDays(new Date(), 120),
      },
      {
        productId: leite.id,
        quantity: 8,
        costCents: 380,
        expiresAt: addDays(new Date(), 5),
      },
      {
        productId: leite.id,
        quantity: 30,
        costCents: 360,
        expiresAt: addDays(new Date(), 25),
      },
    ],
  });

  console.log("Seed OK");
  console.log("  dono@prateleira.app / demo1234 (OWNER)");
  console.log("  caixa@prateleira.app / demo1234 (CASHIER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
