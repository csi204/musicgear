"use client";

import { useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  buildLoginUrl,
  buildLogoutUrl,
  buildRegisterUrl,
  clearSession,
  fetchCurrentUser,
  isAuthenticated,
} from "../lib/auth";

type AuthUser = {
  // DB format (from /users/me)
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  // JWT format fallback (from /auth/me)
  given_name?: string;
  family_name?: string;
  roles?: { key: string }[];
};

const ROLE_LABELS: Record<string, string> = {
  admin: "แอดมิน",
  staff: "พนักงาน",
  customer: "ลูกค้า",
};

export function LoginButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!isAuthenticated()) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const currentUser = await fetchCurrentUser();
      if (active) {
        setUser(currentUser);
        setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-sm">กำลังตรวจสอบสถานะ...</p>;
  }

  if (user) {
    // Support both DB format (firstName/lastName) and JWT format (given_name/family_name)
    const displayName =
      [user.firstName ?? user.given_name, user.lastName ?? user.family_name]
        .filter(Boolean)
        .join(" ") || user.email || "ผู้ใช้";

    // Role from DB (flat string) or JWT (roles array)
    const rawRole = user.role ?? user.roles?.[0]?.key ?? null;
    const roleLabel = rawRole ? (ROLE_LABELS[rawRole] ?? rawRole) : null;

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          เข้าสู่ระบบแล้ว: <span className="font-medium">{displayName}</span>
          {roleLabel ? ` (${roleLabel})` : null}
        </p>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            clearSession();
            window.location.href = buildLogoutUrl("/");
          }}
        >
          ออกจากระบบ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        className="w-fit"
        onClick={() => {
          window.location.href = buildLoginUrl("/auth/callback");
        }}
      >
        เข้าสู่ระบบ
      </Button>
      <Button
        variant="outline"
        className="w-fit"
        onClick={() => {
          window.location.href = buildRegisterUrl("/auth/callback");
        }}
      >
        สมัครสมาชิก
      </Button>
    </div>
  );
}
