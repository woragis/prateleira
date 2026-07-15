import Stripe from "stripe";
import { getEnv, hasStripeConfig } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!hasStripeConfig()) {
    throw new Error("Stripe não configurado. Defina as chaves no .env");
  }
  if (!stripe) {
    stripe = new Stripe(getEnv().STRIPE_SECRET_KEY!);
  }
  return stripe;
}

export function priceIdForPlan(plan: "ESSENCIAL" | "PROFISSIONAL"): string {
  const env = getEnv();
  if (plan === "ESSENCIAL") return env.STRIPE_PRICE_ESSENCIAL!;
  return env.STRIPE_PRICE_PROFISSIONAL!;
}

export function planFromPriceId(priceId: string): "ESSENCIAL" | "PROFISSIONAL" | "NONE" {
  const env = getEnv();
  if (priceId === env.STRIPE_PRICE_ESSENCIAL) return "ESSENCIAL";
  if (priceId === env.STRIPE_PRICE_PROFISSIONAL) return "PROFISSIONAL";
  return "NONE";
}
