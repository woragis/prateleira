import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie session Auth.js v5 — only existence check (no Prisma on Edge). */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/billing");

  if (isProtected && !session) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/app/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/billing", "/login", "/register"],
};
