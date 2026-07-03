"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings, LogOut, PackageSearch, Tag } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "ภาพรวมระบบ" },
    { href: "/dashboard/categories", icon: Tag, label: "จัดการหมวดหมู่" },
    { href: "/dashboard/products", icon: PackageSearch, label: "จัดการสินค้า" },
    { href: "/dashboard/users", icon: Users, label: "จัดการผู้ใช้งาน" },
    { href: "/dashboard/reports", icon: FileText, label: "รายงาน" },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col h-full shadow-sm">
      <div className="h-28 px-6 pt-6 flex flex-col justify-center">
        <h1 className="text-2xl font-bold tracking-tight">MusicGear</h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">WAREHOUSE ADMIN</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm font-medium ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-1">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Settings className="h-5 w-5" />
          ตั้งค่าระบบ
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <LogOut className="h-5 w-5" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
