import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "K9xL2pQ8mF4vC1nB7zH3jR5wT6yN0kM4";


export async function GET(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const COOKIE_NAME = isSecure ? "__Secure-mg_web_session" : "mg_web_session";
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
