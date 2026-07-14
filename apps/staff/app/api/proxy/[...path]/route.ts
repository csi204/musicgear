import { NextRequest, NextResponse } from "next/server";

async function handleProxy(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const token = req.cookies.get("__Secure-mg_staff_session")?.value || req.cookies.get("mg_staff_session")?.value;
  const params = await props.params;
  const path = params.path.join("/");
  const search = req.nextUrl.search;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788";
  
  const url = `${apiUrl}/${path}${search}`;

  const headers = new Headers(req.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  headers.delete("host");
  headers.delete("connection");

  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });
    
    const resHeaders = new Headers(res.headers);
    resHeaders.delete("content-encoding");
    resHeaders.delete("content-length");
    
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error("[Proxy Error]:", err);
    return NextResponse.json({ error: "Internal Proxy Error", details: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return handleProxy(req, props); }
export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return handleProxy(req, props); }
export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return handleProxy(req, props); }
export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return handleProxy(req, props); }
export async function PATCH(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return handleProxy(req, props); }
