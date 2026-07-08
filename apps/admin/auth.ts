// @ts-nocheck
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SignJWT, jwtVerify } from "jose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
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
          
          // STRICT LOGIN: Admin only
          if (user.role !== "admin") {
            return null; // Block non-admin
          }
          
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
      name: process.env.NODE_ENV === "production" ? "__Secure-mg_admin_session" : "mg_admin_session",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-dev-secret-1234567890",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.userId;
        token.role = user.role;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
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
