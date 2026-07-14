import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-dev-secret-1234567890";
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");

  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-mg_admin_session"
    : "mg_admin_session";

  const token = req.cookies.get(cookieName)?.value;

  let isLoggedIn = false;
  if (token) {
    try {
      const encodedSecret = new TextEncoder().encode(secret);
      await jwtVerify(token, encodedSecret);
      isLoggedIn = true;
    } catch {
      isLoggedIn = false;
    }
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
