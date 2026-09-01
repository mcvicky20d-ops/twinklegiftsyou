import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe gate: only checks that a session cookie exists so unauthenticated
 * visitors never see the admin shell. The real role check happens server-side
 * in the /admin layout and in every server action via requireAdmin().
 */
export default function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
