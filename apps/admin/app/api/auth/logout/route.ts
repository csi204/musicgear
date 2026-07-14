import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Secure-mg_admin_session" : "mg_admin_session";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
