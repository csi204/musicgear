// next-auth route disabled - using custom auth routes instead
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Use /api/auth/login instead" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Use /api/auth/login instead" }, { status: 404 });
}
