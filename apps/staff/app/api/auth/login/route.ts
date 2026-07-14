import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "K9xL2pQ8mF4vC1nB7zH3jR5wT6yN0kM4";
const COOKIE_NAME = "__Secure-mg_staff_session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788";
    const res = await fetch(`${apiUrl}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { user } = await res.json();

    if (user.role !== "staff" && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Staff only." }, { status: 403 });
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
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
