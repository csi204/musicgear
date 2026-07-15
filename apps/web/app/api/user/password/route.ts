import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "K9xL2pQ8mF4vC1nB7zH3jR5wT6yN0kM4";

export async function PATCH(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const COOKIE_NAME = isSecure ? "__Secure-mg_web_session" : "mg_web_session";
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
