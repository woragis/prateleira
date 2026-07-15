import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      role: "OWNER" | "MANAGER" | "CASHIER";
      activeShopId: string | null;
    };
  }

  interface User {
    organizationId: string;
    role: "OWNER" | "MANAGER" | "CASHIER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    role?: string;
    activeShopId?: string | null;
  }
}
