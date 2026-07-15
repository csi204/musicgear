import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "K9xL2pQ8mF4vC1nB7zH3jR5wT6yN0kM4";


export async function POST(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const COOKIE_NAME = isSecure ? "__Secure-mg_admin_session" : "mg_admin_session";
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788";
    console.log("Attempting fetch to:", `${apiUrl}/auth/verify`);
    
    const res = await fetch(`${apiUrl}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const responseText = await res.text();
    console.log("API Gateway Response Status:", res.status);
    console.log("API Gateway Response Body:", responseText);

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid credentials", details: responseText }, { status: 401 });
    }

    const { user } = JSON.parse(responseText);

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    const encodedSecret = new TextEncoder().encode(SECRET);
    const token = await new SignJWT({
      userId: user.userId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(encodedSecret);

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
