import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  canAccessApp,
  trialDaysLeft,
  planLimits,
  accessReason,
} from "@/lib/billing";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { hasStripeConfig } from "@/lib/env";
import { logoutAction } from "@/actions/auth";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });
  const stripeOk = hasStripeConfig();
  const limits = planLimits(org.plan);
  const days = trialDaysLeft(org);
  const reason = accessReason(org);
  const ok = canAccessApp(org);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-8">
        <Link href={ok ? "/app/dashboard" : "/"} className="font-display text-2xl text-brand-dark">
          Prateleira
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {ok && (
            <Link href="/app/dashboard" className="text-brand">
              Voltar ao app
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="text-muted">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">Assinatura</h1>
        <p className="mt-2 text-muted">
          Organização <strong>{org.name}</strong> · status{" "}
          <strong>{org.subscriptionStatus}</strong> · plano{" "}
          <strong>{limits.label}</strong>
        </p>

        {sp.success && (
          <p className="mt-4 rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">
            Assinatura confirmada. Pode levar alguns segundos para o webhook sincronizar.
          </p>
        )}
        {sp.canceled && (
          <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
            Checkout cancelado.
          </p>
        )}

        {!ok && (
          <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {reason === "trial_expired"
              ? "Trial expirado. Escolha um plano para continuar."
              : "Assinatura inativa. Assine ou reative no portal."}
          </p>
        )}

        {(org.subscriptionStatus === "TRIALING" ||
          org.subscriptionStatus === "NONE") &&
          days > 0 && (
            <p className="mt-4 text-sm text-muted">
              Trial: {days} dia(s) restante(s).
            </p>
          )}

        {!stripeOk && (
          <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted">
            Stripe em modo placeholder. Configure as variáveis STRIPE_* no .env
            (veja README) para ativar Checkout e Portal.
          </p>
        )}

        {session.user.role === "OWNER" ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <form
              action={async () => {
                "use server";
                await createCheckoutSession("ESSENCIAL");
              }}
            >
              <button
                type="submit"
                disabled={!stripeOk}
                className="w-full rounded-2xl border border-border bg-card p-5 text-left hover:border-brand disabled:opacity-50"
              >
                <div className="font-display text-xl">Essencial</div>
                <div className="mt-1 text-2xl font-semibold">R$ 97/mês</div>
                <div className="mt-2 text-sm text-muted">1 loja · 5 usuários</div>
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await createCheckoutSession("PROFISSIONAL");
              }}
            >
              <button
                type="submit"
                disabled={!stripeOk}
                className="w-full rounded-2xl border border-accent bg-card p-5 text-left hover:border-brand disabled:opacity-50"
              >
                <div className="font-display text-xl">Profissional</div>
                <div className="mt-1 text-2xl font-semibold">R$ 197/mês</div>
                <div className="mt-2 text-sm text-muted">20 lojas · 50 usuários</div>
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Apenas o dono (OWNER) gerencia a assinatura.
          </p>
        )}

        {session.user.role === "OWNER" && org.stripeCustomerId && stripeOk && (
          <form
            action={async () => {
              "use server";
              await createPortalSession();
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-card"
            >
              Gerenciar assinatura (portal Stripe)
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
