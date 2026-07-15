import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getEnv, hasStripeConfig } from "@/lib/env";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type { Plan, SubscriptionStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "NONE";
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const organizationId =
    sub.metadata.organizationId ||
    (typeof sub.customer === "string"
      ? (
          await prisma.organization.findFirst({
            where: { stripeCustomerId: sub.customer },
          })
        )?.id
      : undefined);

  if (!organizationId) return;

  const priceId = sub.items.data[0]?.price.id;
  const plan = (priceId ? planFromPriceId(priceId) : "NONE") as Plan;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
      stripeSubscriptionId: sub.id,
      plan: plan === "NONE" ? undefined : plan,
      subscriptionStatus: mapStatus(sub.status),
    },
  });
}

export async function POST(req: Request) {
  if (!hasStripeConfig()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const secret = getEnv().STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (organizationId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        await syncSubscription(sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
