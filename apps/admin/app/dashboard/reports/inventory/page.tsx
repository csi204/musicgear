"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExportReportButton } from "@/components/export-report-button";
import { getAccessToken, getApiBaseUrl, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";

const NUM = (n: number) => new Intl.NumberFormat("th-TH").format(n);
const PAGE_SIZE = 12;

export default function InventoryReportPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const apiBase = getApiBaseUrl();

      // Fetch ALL inventory (paginated)
      const res = await fetch(`${apiBase}/reports/inventory?page=${p}&limit=${PAGE_SIZE}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.status === 401) { clearSession(); router.push("/"); return; }
      if (!res.ok) throw new Error(`ข้อผิดพลาด ${res.status}`);
      const json = await res.json();

      // Also fetch dashboard summary for KPIs (inventory health)
      const r = { start: "2020-01-01", end: new Date().toISOString().split('T')[0] };
      const res2 = await fetch(`${apiBase}/reports/dashboard-summary?start=${new Date(r.start).toISOString()}&end=${new Date(r.end + "T23:59:59").toISOString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const summaryJson = res2.ok ? await res2.json() : null;

      setData({ items: json.items, alerts: json.items, pagination: json.pagination, inventory: summaryJson?.inventory });
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  const health = data?.inventory?.health ?? [];
  const critical = health.find((h: any) => h.name === "Critical")?.value ?? 0;
  const low = health.find((h: any) => h.name === "Low Stock")?.value ?? 0;
  const ok = health.find((h: any) => h.name === "In Stock")?.value ?? 0;

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">รายงานสินค้าคงคลัง</h3>
          <p className="text-sm text-zinc-500 mt-0.5">ข้อมูลสินค้าทั้งหมดจากตาราง InventorySnapshot ในฐานข้อมูลจริง</p>
        </div>
        <ExportReportButton reportType="inventory" data={data} />
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "สินค้าปกติ (In Stock)", value: ok, color: "text-emerald-600" },
          { label: "สต็อกต่ำ (Low Stock)", value: low, color: "text-amber-600" },
          { label: "วิกฤต / หมดสต็อก", value: critical, color: "text-rose-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">{kpi.label}</p>
            <h4 className={cn("text-3xl font-bold mt-2", kpi.color, isLoading ? "animate-pulse opacity-40" : "")}>
              {isLoading ? "..." : NUM(kpi.value)} <span className="text-sm font-normal text-zinc-500">รายการ</span>
            </h4>
          </div>
        ))}
      </div>

      {/* All Items Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">รายการสินค้าคงคลัง</h4>
          <p className="text-xs text-zinc-500">
            {isLoading ? "กำลังโหลด..." : `แสดงหน้า ${page}/${totalPages} (ข้อมูลทั้งหมด ${data?.pagination?.total ?? 0} รายการ)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3">ชื่อสินค้า</th>
                <th className="px-6 py-3">รหัสสินค้า (SKU)</th>
                <th className="px-6 py-3 text-right">จำนวนคงเหลือ</th>
                <th className="px-6 py-3 text-right">จุดสั่งซื้อ</th>
                <th className="px-6 py-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-48" /></td>
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-24" /></td>
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-12 ml-auto" /></td>
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-12 ml-auto" /></td>
                    <td className="px-6 py-3"><div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              )}
              {!isLoading && items.map((item: any, i: number) => (
                <tr key={item.id ?? i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-zinc-900 dark:text-white">{item.productName}</td>
                  <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{item.sku}</td>
                  <td className="px-6 py-3 text-right font-bold text-zinc-900 dark:text-white">{NUM(item.stockLevel)}</td>
                  <td className="px-6 py-3 text-right text-zinc-500">{NUM(item.reorderPoint)}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold",
                      item.status === "Critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                      : item.status === "Low" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    )}>
                      {item.status === "Critical" ? "วิกฤต" : item.status === "Low" ? "ต่ำ" : "ปกติ"}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-400">ไม่มีข้อมูลสินค้าในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">หน้า {page} จาก {totalPages} ({data?.pagination?.total ?? 0} รายการ)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                ก่อนหน้า
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-7 text-xs rounded-lg transition-colors ${
                      p === page
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold"
                        : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                ถัดไป
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
