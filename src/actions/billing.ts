"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getStripe, priceIdForPlan, planFromPriceId } from "@/lib/stripe";
import { hasStripeConfig } from "@/lib/env";
import type { Plan, SubscriptionStatus } from "@/generated/prisma/client";

export async function createCheckoutSession(plan: "ESSENCIAL" | "PROFISSIONAL") {
  const session = await requireSession();
  if (session.user.role !== "OWNER") {
    throw new Error("Apenas o dono pode gerenciar a assinatura.");
  }
  if (!hasStripeConfig()) {
    throw new Error(
      "Stripe ainda não configurado. Defina STRIPE_* no .env (veja README).",
    );
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  const stripe = getStripe();
  const origin = (await headers()).get("origin") || process.env.AUTH_URL || "http://localhost:3000";

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    success_url: `${origin}/billing?success=1`,
    cancel_url: `${origin}/billing?canceled=1`,
    metadata: { organizationId: org.id, plan },
    subscription_data: {
      metadata: { organizationId: org.id, plan },
    },
  });

  if (!checkout.url) throw new Error("Falha ao criar Checkout Session");
  redirect(checkout.url);
}

export async function createPortalSession() {
  const session = await requireSession();
  if (session.user.role !== "OWNER") {
    throw new Error("Apenas o dono pode gerenciar a assinatura.");
  }
  if (!hasStripeConfig()) {
    throw new Error("Stripe não configurado.");
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });
  if (!org.stripeCustomerId) {
    throw new Error("Nenhuma assinatura encontrada. Assine um plano primeiro.");
  }

  const stripe = getStripe();
  const origin = (await headers()).get("origin") || process.env.AUTH_URL || "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${origin}/billing`,
  });
  redirect(portal.url);
}

export async function applySubscriptionToOrg(params: {
  organizationId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  priceId?: string | null;
  status: string;
}) {
  const plan = params.priceId
    ? planFromPriceId(params.priceId)
    : ("NONE" as Plan);

  const statusMap: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    incomplete: "NONE",
    incomplete_expired: "CANCELED",
  };

  await prisma.organization.update({
    where: { id: params.organizationId },
    data: {
      stripeCustomerId: params.customerId ?? undefined,
      stripeSubscriptionId: params.subscriptionId ?? undefined,
      plan: plan === "NONE" ? undefined : plan,
      subscriptionStatus: statusMap[params.status] ?? "NONE",
    },
  });
}
