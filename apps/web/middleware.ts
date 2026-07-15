import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "K9xL2pQ8mF4vC1nB7zH3jR5wT6yN0kM4";
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-mg_web_session"
    : "mg_web_session";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/account/:path*"],
};
