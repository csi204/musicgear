"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Package, Boxes, Layers, FileBarChart, LogOut, Sun, Moon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";
import { clearSession } from "../../lib/auth";

const navItems = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "ออเดอร์ (Orders)", icon: ClipboardList },
  { href: "/dashboard/products", label: "สินค้า (Products)", icon: Package },
  { href: "/dashboard/inventory", label: "คลังสินค้า (Inventory)", icon: Boxes },
  { href: "/dashboard/bundles", label: "เซ็ตสินค้า (Bundles)", icon: Layers },
  { href: "/dashboard/reports", label: "รายงาน (Reports)", icon: FileBarChart },
];

export function ThemeToggleItem({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-200 group cursor-pointer",
        collapsed && "justify-center px-0"
      )}
      title={mounted ? (theme === "dark" ? "โหมดสว่าง" : "โหมดมืด") : "ธีม"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
        <Sun className="absolute w-5 h-5 text-zinc-400 transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90 group-hover:text-yellow-500" />
        <Moon className="absolute w-5 h-5 text-zinc-400 transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0 group-hover:text-blue-400" />
      </div>
      {!collapsed && <span>{mounted ? (theme === "dark" ? "โหมดสว่าง" : "โหมดมืด") : "ธีม"}</span>}
    </button>
  );
}

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
  setMobileOpen?: (v: boolean) => void;
}

export function Sidebar({ collapsed = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, loading } = useUser();

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard/reports") {
      return !loading && isAdmin;
    }
    return true;
  });

  return (
    <div className={cn(
      "print:hidden h-full border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex flex-col flex-shrink-0 z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "h-16 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60",
        collapsed ? "px-2 justify-center" : "px-6"
      )}>
        {!collapsed ? (
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-zinc-900 dark:text-zinc-50 tracking-tight">MusicGear</h1>
            <p className="text-[10px] font-bold text-zinc-400 tracking-wider">WAREHOUSE STAFF</p>
          </div>
        ) : (
          <div className="mx-auto">
            <h1 className="text-lg font-black leading-tight text-amber-500 tracking-tight">MG</h1>
          </div>
        )}
        {!collapsed && setMobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-650 cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <nav className={cn("flex-1 py-6 space-y-1", collapsed ? "px-2" : "px-4")}>
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group cursor-pointer",
                isActive
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50",
                collapsed && "justify-center px-0"
              )}
              title={item.label}
            >
              <Icon className={cn("w-5 h-5 transition-colors shrink-0 group-hover:scale-105", isActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-zinc-200 dark:border-zinc-800 space-y-1", collapsed ? "p-2" : "p-4")}>
        <ThemeToggleItem collapsed={collapsed} />
        <button
          onClick={async () => {
            clearSession();
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all duration-200 group cursor-pointer",
            collapsed && "justify-center px-0"
          )}
          title="ออกจากระบบ"
        >
          <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-rose-500 transition-colors shrink-0 group-hover:-translate-x-1" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </div>
  );
}
