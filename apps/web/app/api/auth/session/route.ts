import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-dev-secret-1234567890";
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Secure-mg_web_session" : "mg_web_session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  try {
    const encodedSecret = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(token, encodedSecret);
    return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ user: null });
  }
}
