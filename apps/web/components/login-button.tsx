"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  admin: "แอดมิน",
  staff: "พนักงาน",
  customer: "ลูกค้า",
};

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-muted-foreground text-sm">กำลังตรวจสอบสถานะ...</p>;
  }

  if (session?.user) {
    const user = session.user as any;
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || user.name || "ผู้ใช้";

    const roleLabel = user.role ? (ROLE_LABELS[user.role] ?? user.role) : null;

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          เข้าสู่ระบบแล้ว: <span className="font-medium">{displayName}</span>
          {roleLabel ? ` (${roleLabel})` : null}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="w-fit" asChild>
            <Link href="/account">จัดการบัญชี</Link>
          </Button>
          <Button
            variant="outline"
            className="w-fit"
            onClick={async () => {
              // 1. Clear NextAuth session
              await signOut({ redirect: false });
              // 2. Clear Kinde SSO session so user can pick account next time
              window.location.href = "https://musicgear.kinde.com/logout?redirect=http://localhost:8800/";
            }}
          >
            ออกจากระบบ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button className="w-fit" asChild>
        <Link href="/login">เข้าสู่ระบบ</Link>
      </Button>
      <Button variant="outline" className="w-fit" asChild>
        <Link href="/register">สมัครสมาชิก</Link>
      </Button>
    </div>
  );
}
