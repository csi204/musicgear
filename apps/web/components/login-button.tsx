"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { User, LogOut, Settings, ShoppingBag, UserCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  admin: "แอดมิน",
  staff: "พนักงาน",
  customer: "ลูกค้า",
};

interface LoginButtonProps {
  compact?: boolean;
}

function useWebSession() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      })
      .catch(() => setStatus("unauthenticated"));
  }, []);

  return { user, status };
}

export function LoginButton({ compact = false }: LoginButtonProps) {
  const { user, status } = useWebSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (status === "loading") {
    return (
      <div className="h-9 w-9 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  if (user) {
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      user.name ||
      "ผู้ใช้";

    const userImage = user.image || user.picture;
    const roleLabel = ROLE_LABELS[user.role] ?? user.role;

    if (compact) {
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 transition-colors duration-150"
            title={displayName}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <Avatar className="h-6 w-6">
              {userImage && (
                <AvatarImage src={userImage} alt={displayName} className="object-cover" />
              )}
              <AvatarFallback className="bg-stone-800 text-white font-semibold text-[10px]">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div
            className={cn(
              "absolute right-0 top-[calc(100%+8px)] w-56 origin-top-right rounded-xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out z-50 overflow-hidden",
              dropdownOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100 bg-stone-50/60">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {userImage && (
                  <AvatarImage src={userImage} alt={displayName} className="object-cover" />
                )}
                <AvatarFallback className="bg-stone-800 text-white font-bold text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">{displayName}</p>
                {roleLabel && (
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-0.5">
                    {roleLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="py-1.5">
              <DropdownItem href="/account" icon={<UserCircle className="h-3.5 w-3.5" />} label="โปรไฟล์" onClick={() => setDropdownOpen(false)} />
              <DropdownItem href="/orders" icon={<ShoppingBag className="h-3.5 w-3.5" />} label="คำสั่งซื้อของฉัน" onClick={() => setDropdownOpen(false)} />
              <DropdownItem href="/account/settings" icon={<Settings className="h-3.5 w-3.5" />} label="ตั้งค่าบัญชี" onClick={() => setDropdownOpen(false)} />
            </div>

            <div className="border-t border-stone-100 py-1.5">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors duration-150 rounded-md mx-auto"
                style={{ width: "calc(100% - 8px)", margin: "0 4px" }}
              >
                <LogOut className="h-3.5 w-3.5" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      );
    }

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
                {roleLabel}
              </span>
            )}
          </div>
        </Link>

        <Button
          variant="outline"
          className="h-9 rounded-full border-neutral-300 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-xs font-bold transition-all px-4 cursor-pointer"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </Button>
      </div>
    );
  }

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

function DropdownItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-950 transition-colors duration-150 rounded-md mx-1"
    >
      <span className="text-stone-400">{icon}</span>
      {label}
    </Link>
  );
}
