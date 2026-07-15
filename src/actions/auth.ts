"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { slugify } from "@/lib/money";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(2),
  shopName: z.string().min(2).optional(),
});

export type AuthActionState = { error?: string; success?: boolean };

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
    shopName: formData.get("shopName") || undefined,
  });

  if (!parsed.success) {
    return { error: "Preencha todos os campos corretamente." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este e-mail já está cadastrado." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const orgSlugBase = slugify(parsed.data.organizationName) || "loja";
  let orgSlug = orgSlugBase;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug: orgSlug } })) {
    orgSlug = `${orgSlugBase}-${i++}`;
  }

  const shopName = parsed.data.shopName || parsed.data.organizationName;
  const shopSlug = slugify(shopName) || "principal";

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
      },
    });

    const org = await tx.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug: orgSlug,
        trialEndsAt: addDays(new Date(), 14),
        plan: "NONE",
        subscriptionStatus: "TRIALING",
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "OWNER",
      },
    });

    await tx.shop.create({
      data: {
        organizationId: org.id,
        name: shopName,
        slug: shopSlug,
      },
    });
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/app/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Conta criada, mas falhou o login automático." };
    }
    throw e;
  }

  return { success: true };
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").toLowerCase();
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/app/dashboard");

  if (!email || password.length < 6) {
    return { error: "E-mail ou senha inválidos." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    throw e;
  }

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
