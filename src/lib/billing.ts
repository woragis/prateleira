import type { Organization, Plan, SubscriptionStatus } from "@/generated/prisma/client";

const PLAN_LIMITS: Record<
  Plan,
  { shops: number; members: number; label: string; priceLabel: string }
> = {
  NONE: { shops: 1, members: 3, label: "Trial", priceLabel: "Grátis" },
  ESSENCIAL: { shops: 1, members: 5, label: "Essencial", priceLabel: "R$ 97/mês" },
  PROFISSIONAL: { shops: 20, members: 50, label: "Profissional", priceLabel: "R$ 197/mês" },
};

export function planLimits(plan: Plan) {
  return PLAN_LIMITS[plan];
}

export function isTrialActive(org: Pick<Organization, "trialEndsAt">): boolean {
  return org.trialEndsAt.getTime() > Date.now();
}

/** App access: active trial OR paid statuses with grace on past_due */
export function canAccessApp(
  org: Pick<Organization, "trialEndsAt" | "subscriptionStatus" | "plan">,
): boolean {
  const status = org.subscriptionStatus as SubscriptionStatus;
  if (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE") {
    return true;
  }
  if (status === "NONE" || status === "CANCELED") {
    return isTrialActive(org);
  }
  return isTrialActive(org);
}

export function trialDaysLeft(org: Pick<Organization, "trialEndsAt">): number {
  const ms = org.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export type AccessReason =
  | "ok"
  | "trial_expired"
  | "subscription_canceled"
  | "no_access";

export function accessReason(
  org: Pick<Organization, "trialEndsAt" | "subscriptionStatus" | "plan">,
): AccessReason {
  if (canAccessApp(org)) return "ok";
  if (org.subscriptionStatus === "CANCELED") return "subscription_canceled";
  if (!isTrialActive(org)) return "trial_expired";
  return "no_access";
}
