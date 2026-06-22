"use client";

import { useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  buildLoginUrl,
  buildLogoutUrl,
  clearSession,
  fetchCurrentUser,
  isAuthenticated,
} from "../lib/auth";

type AuthUser = {
  email?: string;
  given_name?: string;
  family_name?: string;
  role?: string;
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
    const displayName =
      [user.given_name, user.family_name].filter(Boolean).join(" ") || user.email || "ผู้ใช้";

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          เข้าสู่ระบบแล้ว: <span className="font-medium">{displayName}</span>
          {user.role ? ` (${user.role})` : null}
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
    <Button className="w-fit" onClick={() => {
      window.location.href = buildLoginUrl("/auth/callback");
    }}>
      เข้าสู่ระบบ
    </Button>
  );
}
