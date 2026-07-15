import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessApp } from "@/lib/billing";
import type { MembershipRole } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireOrgAccess() {
  const session = await requireSession();
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });
  if (!canAccessApp(org)) {
    redirect("/billing");
  }
  return { session, org };
}

export async function requireRole(roles: MembershipRole[]) {
  const ctx = await requireOrgAccess();
  if (!roles.includes(ctx.session.user.role)) {
    redirect("/app/dashboard");
  }
  return ctx;
}

export async function getActiveShopId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.activeShopId) {
    const shop = await prisma.shop.findFirst({
      where: {
        id: session.user.activeShopId,
        organizationId: session.user.organizationId,
      },
    });
    if (shop) return shop.id;
  }

  const first = await prisma.shop.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });
  return first?.id ?? null;
}
