"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { User } from "lucide-react";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  admin: "แอดมิน",
  staff: "พนักงาน",
  customer: "ลูกค้า",
};

interface LoginButtonProps {
  compact?: boolean;
}

export function LoginButton({ compact = false }: LoginButtonProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-9 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  if (session?.user) {
    const user = session.user as any;
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      user.name ||
      "ผู้ใช้";

    const userImage = user.image || user.picture;

    if (compact) {
      // Compact mode: avatar only, links to /account
      return (
        <Link
          href="/account"
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 transition-colors duration-150"
          title={displayName}
        >
          <Avatar className="h-6 w-6">
            {userImage && (
              <AvatarImage src={userImage} alt={displayName} className="object-cover" />
            )}
            <AvatarFallback className="bg-stone-800 text-white font-semibold text-[10px]">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      );
    }

    // Full mode: avatar + name + sign out button
    return (
      <div className="flex items-center gap-4">
        <Link href="/account" className="flex items-center gap-3 group hover:opacity-90 transition-opacity">
          <Avatar className="h-9 w-9 border border-neutral-200 transition-transform duration-300 group-hover:scale-105">
            {userImage && (
              <AvatarImage src={userImage} alt={displayName} className="object-cover" />
            )}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-neutral-900 leading-tight">
              {displayName}
            </span>
            {user.role && (
              <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide mt-0.5">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            )}
          </div>
        </Link>

        <Button
          variant="outline"
          className="h-9 rounded-full border-neutral-300 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-xs font-bold transition-all px-4 cursor-pointer"
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/";
          }}
        >
          ออกจากระบบ
        </Button>
      </div>
    );
  }

  // Not logged in
  return (
    <Link
      href="/login"
      className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors duration-150"
      aria-label="เข้าสู่ระบบ"
      title="เข้าสู่ระบบ"
    >
      <User className="h-[17px] w-[17px]" />
    </Link>
  );
}
