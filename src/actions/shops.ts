"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole, getActiveShopId } from "@/lib/session";
import { slugify } from "@/lib/money";
import { planLimits } from "@/lib/billing";
import { auth } from "@/lib/auth";

export async function createShopAction(formData: FormData) {
  const { session, org } = await requireRole(["OWNER"]);
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) throw new Error("Nome inválido");

  const limits = planLimits(org.plan === "NONE" ? "NONE" : org.plan);
  const count = await prisma.shop.count({ where: { organizationId: org.id } });
  if (count >= limits.shops) {
    throw new Error(`Plano ${limits.label} permite até ${limits.shops} loja(s). Faça upgrade.`);
  }

  const base = slugify(name) || "loja";
  let slug = base;
  let i = 1;
  while (
    await prisma.shop.findFirst({
      where: { organizationId: org.id, slug },
    })
  ) {
    slug = `${base}-${i++}`;
  }

  await prisma.shop.create({
    data: { organizationId: session.user.organizationId, name, slug },
  });
  revalidatePath("/app/shops");
}

export async function setActiveShopAction(shopId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado");

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, organizationId: session.user.organizationId },
  });
  if (!shop) throw new Error("Loja não encontrada");

  // Persist via cookie for server components (JWT update needs client session.update —
  // use cookie as source of truth for active shop)
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set("prateleira_shop", shopId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/app");
}

export async function resolveActiveShopId(): Promise<string | null> {
  const fromSession = await getActiveShopId();
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const cookieShop = jar.get("prateleira_shop")?.value;
  const session = await auth();
  if (!session?.user) return null;

  if (cookieShop) {
    const shop = await prisma.shop.findFirst({
      where: { id: cookieShop, organizationId: session.user.organizationId },
    });
    if (shop) return shop.id;
  }
  return fromSession;
}

const memberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["MANAGER", "CASHIER"]),
});

export async function addMemberAction(formData: FormData) {
  const { session, org } = await requireRole(["OWNER", "MANAGER"]);
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const limits = planLimits(org.plan === "NONE" ? "NONE" : org.plan);
  const count = await prisma.membership.count({
    where: { organizationId: org.id },
  });
  if (count >= limits.members) {
    throw new Error(`Limite de ${limits.members} usuários no plano ${limits.label}.`);
  }

  const email = parsed.data.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
      },
    });
  }

  const existing = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: session.user.organizationId,
      },
    },
  });
  if (existing) throw new Error("Usuário já faz parte da organização.");

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: session.user.organizationId,
      role: parsed.data.role,
    },
  });
  revalidatePath("/app/team");
}
