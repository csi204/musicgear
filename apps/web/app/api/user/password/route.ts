import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { SignJWT } from "jose";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.userId) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Generate internal token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "fallback-dev-secret-1234567890"
    );
    
    const internalToken = await new SignJWT({
      sub: session.user.userId,
      email: session.user.email,
      role: session.user.role || "customer",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);

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
