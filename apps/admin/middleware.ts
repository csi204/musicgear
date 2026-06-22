import { NextRequest, NextResponse } from "next/server";

function buildLoginRedirect(request: NextRequest) {
  const authBase = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://127.0.0.1:8788";
  const origin = request.nextUrl.origin.replace("0.0.0.0", "127.0.0.1");
  const redirectUri = `${origin}/auth/callback`;
  const loginUrl = new URL(`${authBase}/auth/login`);
  loginUrl.searchParams.set("redirect_uri", redirectUri);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("mg_session")?.value === "1";
  if (hasSession) {
    return NextResponse.next();
  }

  return buildLoginRedirect(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
