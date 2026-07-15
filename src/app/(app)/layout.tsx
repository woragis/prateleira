import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { resolveActiveShopId } from "@/actions/shops";
import { canAccessApp, trialDaysLeft, planLimits } from "@/lib/billing";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  if (!canAccessApp(org)) {
    redirect("/billing");
  }

  const shops = await prisma.shop.findMany({
    where: { organizationId: org.id },
    orderBy: { name: "asc" },
  });
  const activeShopId = await resolveActiveShopId();

  const days = trialDaysLeft(org);
  const limits = planLimits(org.plan);
  let banner: React.ReactNode = null;

  if (org.subscriptionStatus === "PAST_DUE") {
    banner = (
      <div className="bg-accent px-4 py-2 text-center text-sm text-white">
        Pagamento em atraso — atualize o cartão no portal Stripe.
      </div>
    );
  } else if (
    (org.subscriptionStatus === "TRIALING" || org.subscriptionStatus === "NONE") &&
    days <= 3
  ) {
    banner = (
      <div className="bg-brand px-4 py-2 text-center text-sm text-white">
        Trial: {days} dia(s) restante(s) · plano {limits.label}.{" "}
        <Link href="/billing" className="underline">
          Assinar
        </Link>
      </div>
    );
  }

  return (
    <AppShell
      role={session.user.role}
      orgName={org.name}
      shops={shops}
      activeShopId={activeShopId}
      banner={banner}
    >
      {children}
    </AppShell>
  );
}
