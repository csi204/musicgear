import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET(req: NextRequest) {
  const kindeIssuer = process.env.KINDE_ISSUER_URL || "https://musicgear.kinde.com";
  const clientId = process.env.KINDE_CLIENT_ID || "";
  const redirectUri = "http://localhost:8800/api/auth/callback/kinde";
  const connectionId = "conn_019ee5d95bfd2150cca15e493509718b";

  // PKCE
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  const state = base64url(crypto.randomBytes(16));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    connection_id: connectionId,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    start_page: "registration", // auto-create account if not exists
  });

  const url = `${kindeIssuer}/oauth2/auth?${params.toString()}`;

  // Store code_verifier in cookie so we can use it in the callback
  const response = NextResponse.redirect(url);
  response.cookies.set("kinde_code_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  response.cookies.set("kinde_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
