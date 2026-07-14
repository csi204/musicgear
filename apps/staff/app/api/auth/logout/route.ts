import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const COOKIE_NAME = isSecure ? "__Secure-mg_staff_session" : "mg_staff_session";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
