import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { ShopSwitcher } from "@/components/shop-switcher";
import type { MembershipRole } from "@/generated/prisma/client";

const links: {
  href: string;
  label: string;
  roles: MembershipRole[];
}[] = [
  { href: "/app/dashboard", label: "Dashboard", roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/app/pos", label: "PDV", roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/app/products", label: "Produtos", roles: ["OWNER", "MANAGER"] },
  { href: "/app/lots", label: "Lotes", roles: ["OWNER", "MANAGER"] },
  { href: "/app/categories", label: "Categorias", roles: ["OWNER", "MANAGER"] },
  { href: "/app/sales", label: "Vendas", roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/app/shops", label: "Lojas", roles: ["OWNER"] },
  { href: "/app/team", label: "Equipe", roles: ["OWNER", "MANAGER"] },
  { href: "/billing", label: "Assinatura", roles: ["OWNER"] },
];

export function AppShell({
  children,
  role,
  orgName,
  shops,
  activeShopId,
  banner,
}: {
  children: React.ReactNode;
  role: MembershipRole;
  orgName: string;
  shops: { id: string; name: string }[];
  activeShopId: string | null;
  banner?: React.ReactNode;
}) {
  const nav = links.filter((l) => l.roles.includes(role));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-brand-dark text-white lg:border-b-0 lg:border-r lg:border-brand">
        <div className="px-5 py-6">
          <Link href="/app/dashboard" className="font-display text-2xl tracking-tight">
            Prateleira
          </Link>
          <p className="mt-1 truncate text-sm text-white/70">{orgName}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="hidden px-5 pb-6 lg:block">
          <button type="submit" className="text-sm text-white/60 hover:text-white">
            Sair
          </button>
        </form>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
          <ShopSwitcher shops={shops} activeShopId={activeShopId} />
          <form action={logoutAction} className="lg:hidden">
            <button type="submit" className="text-sm text-muted">
              Sair
            </button>
          </form>
        </header>
        {banner}
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
