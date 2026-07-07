"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "ยอดขาย", href: "/dashboard/reports/sales" },
    { name: "การเงิน", href: "/dashboard/reports/financial" },
    { name: "สินค้าคงคลัง", href: "/dashboard/reports/inventory" },
  ];

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">รายงาน</h2>
        <p className="text-zinc-500 mt-1 text-sm">ดูข้อมูลยอดขาย การเงิน และสต็อกสินค้าจากฐานข้อมูลจริง</p>
      </div>

      {/* Tabs */}
      <div className="print:hidden bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 rounded-2xl inline-flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
