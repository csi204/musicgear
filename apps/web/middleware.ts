import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/products", "/cart", "/auth/callback"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  return pathname.startsWith("/products/");
}

function buildLoginRedirect(request: NextRequest, returnTo?: string) {
  const authBase = process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8788";
  const origin = request.nextUrl.origin.replace("0.0.0.0", "127.0.0.1");
  const redirectUri = `${origin}/auth/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
  const loginUrl = new URL(`${authBase}/auth/login`);
  loginUrl.searchParams.set("redirect_uri", redirectUri);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("mg_session")?.value === "1";
  if (hasSession) {
    return NextResponse.next();
  }

  return buildLoginRedirect(request);
}

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/account/:path*"],
};
