import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "__Secure-mg_web_session";
const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-dev-secret-1234567890";

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const encodedSecret = new TextEncoder().encode(SECRET);
    let sessionUser: any = null;
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      sessionUser = payload;
    } catch {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }
    
    if (!sessionUser?.userId) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Generate internal token
    const internalToken = await new SignJWT({
      sub: sessionUser.userId,
      email: sessionUser.email,
      role: sessionUser.role || "customer",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(encodedSecret);

    // Proxy request to backend
    const res = await fetch("http://127.0.0.1:8788/users/me/password", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${internalToken}`
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}
