import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            memberships: {
              include: { organization: true },
              take: 1,
            },
          },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        const membership = user.memberships[0];
        if (!membership) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership.organizationId,
          role: membership.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.organizationId = (user as { organizationId: string }).organizationId;
        token.role = (user as { role: string }).role;
        token.activeShopId = undefined;
      }
      if (trigger === "update" && session) {
        if (session.activeShopId !== undefined) {
          token.activeShopId = session.activeShopId as string | null;
        }
        if (session.role !== undefined) {
          token.role = session.role as string;
        }
        if (session.organizationId !== undefined) {
          token.organizationId = session.organizationId as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.organizationId = token.organizationId as string;
        session.user.role = token.role as "OWNER" | "MANAGER" | "CASHIER";
        session.user.activeShopId = (token.activeShopId as string | undefined) ?? null;
      }
      return session;
    },
  },
});
