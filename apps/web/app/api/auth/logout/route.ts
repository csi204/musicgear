import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Secure-mg_web_session" : "mg_web_session";

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
