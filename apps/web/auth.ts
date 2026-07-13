// @ts-nocheck
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KindeProvider from "next-auth/providers/kinde";
import { SignJWT, jwtVerify } from "jose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KindeProvider({
      clientId: process.env.KINDE_CLIENT_ID || "dummy-id",
      clientSecret: process.env.KINDE_CLIENT_SECRET || "dummy-secret",
      issuer: process.env.KINDE_ISSUER_URL || "https://dummy.kinde.com",
      authorization: {
        params: {
          connection_id: "conn_019ee5d95bfd2150cca15e493509718b",
          prompt: "login"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788"}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          
          if (!res.ok) return null;
          const { user } = await res.json();
          return user;
        } catch (err) {
          console.error("Authorize error", err);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-mg_web_session" : "mg_web_session",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-dev-secret-1234567890",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "kinde") {
        try {
          // Parse real name/email from id_token
          let firstName = "MusicGear";
          let lastName = "User";
          let email = user.email || "";

          if (account.id_token) {
            try {
              const base64Url = account.id_token.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const idPayload = JSON.parse(atob(base64));
              firstName = idPayload.given_name || firstName;
              lastName = idPayload.family_name || lastName;
              email = idPayload.email || email;
            } catch {}
          }

          // Generate short-lived internal token signed with NEXTAUTH_SECRET
          // so auth-middleware can verify it
          const { SignJWT: JWTSigner } = await import("jose");
          const secret = new TextEncoder().encode(
            process.env.NEXTAUTH_SECRET || "fallback-dev-secret-1234567890"
          );
          const internalToken = await new JWTSigner({
            sub: user.id,
            email,
            given_name: firstName,
            family_name: lastName,
            role: "customer",
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("5m")
            .sign(secret);

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788"}/users/me`, {
            headers: { Authorization: `Bearer ${internalToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            console.log("[auth] User synced to DB:", data?.user?.userId, data?.user?.email);
          } else {
            const errText = await res.text();
            console.error("[auth] Failed to sync user:", res.status, errText);
          }
        } catch (e) {
          console.error("[auth] Error syncing user:", e);
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        // If logged in via credentials, user has our DB structure.
        // If logged in via Kinde, user is from NextAuth.
        if (account?.provider === "kinde") {
           token.userId = user.id;
           token.role = "customer";
           token.email = user.email;
           const parts = (user.name || "").split(" ");
           token.firstName = parts[0] || "";
           token.lastName = parts.slice(1).join(" ") || "";
           token.image = user.image || (profile as any)?.picture || (profile as any)?.image || null;
        } else {
           token.userId = user.userId;
           token.role = user.role;
           token.email = user.email;
           token.firstName = user.firstName;
           token.lastName = user.lastName;
           token.image = user.image || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.userId = token.userId as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.image = token.image as string;
      }
      return session;
    }
  },
  jwt: {
    encode: async ({ secret, token }) => {
      const encodedSecret = new TextEncoder().encode(secret as string);
      return new SignJWT(token as any)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(encodedSecret);
    },
    decode: async ({ secret, token }) => {
      if (!token) return null;
      try {
        const encodedSecret = new TextEncoder().encode(secret as string);
        const { payload } = await jwtVerify(token, encodedSecret);
        return payload;
      } catch {
        return null;
      }
    }
  }
}) as any;
