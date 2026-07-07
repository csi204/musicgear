"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { ExportReportButton } from "@/components/export-report-button";
import { getAccessToken, getApiBaseUrl, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

function today() { return new Date().toISOString().slice(0, 10); }
const THB = (n: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);
const THB2 = (n: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2 }).format(n);
const NUM = (n: number) => new Intl.NumberFormat("th-TH").format(n);

const PAGE_SIZE = 12;

export default function FinancialReportPage() {
  const router = useRouter();
  const [range, setRange] = useState({ start: "2024-01-01", end: today() });
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (r: { start: string; end: string }) => {
    setIsLoading(true);
    setError(null);
    setPage(1); // reset to first page on new range
    try {
      const token = getAccessToken();
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/reports/dashboard-summary`, {
        method: "QUERY",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          start: new Date(r.start).toISOString(),
          end: new Date(r.end + "T23:59:59").toISOString(),
        }),
      });
      if (res.status === 401) { clearSession(); router.push("/"); return; }
      if (!res.ok) throw new Error(`ข้อผิดพลาด ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const trend: any[] = data?.salesTrend ?? [];
  const totalRevenue = useMemo(() => trend.reduce((s, r) => s + Number(r.totalRevenue ?? 0), 0), [trend]);
  const totalOrders = useMemo(() => trend.reduce((s, r) => s + Number(r.totalOrders ?? 0), 0), [trend]);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const totalPages = Math.max(1, Math.ceil(trend.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => trend.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [trend, page]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">รายงานการเงิน</h3>
          <p className="text-sm text-zinc-500 mt-0.5">ข้อมูลจากตาราง DailySalesReport ในฐานข้อมูลจริง</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker onChange={setRange} />
          <ExportReportButton reportType="financial" data={data} onRangeChange={setRange} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "รายรับรวม", value: THB(totalRevenue) },
          { label: "คำสั่งซื้อรวม", value: `${NUM(totalOrders)} รายการ` },
          { label: "มูลค่าเฉลี่ยต่อรายการ", value: THB2(aov) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-2 text-zinc-900 dark:text-white ${isLoading ? "opacity-30 animate-pulse" : ""}`}>
              {isLoading ? "—" : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">สรุปรายรับรายวัน</h4>
            <p className="text-xs text-zinc-500">
              {isLoading ? "กำลังโหลด..." : `${trend.length} วันในช่วงที่เลือก — หน้า ${page}/${totalPages}`}
            </p>
          </div>
          <span className={`text-xl font-bold text-zinc-900 dark:text-white ${isLoading ? "opacity-30" : ""}`}>
            {isLoading ? "—" : THB(totalRevenue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3">วันที่</th>
                <th className="px-6 py-3 text-right">จำนวนรายการ</th>
                <th className="px-6 py-3 text-right">รายรับ</th>
                <th className="px-6 py-3 text-right">เฉลี่ย/รายการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-36" /></td>
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-12 ml-auto" /></td>
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-24 ml-auto" /></td>
                    <td className="px-6 py-3"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              )}
              {!isLoading && pagedRows.map((row: any, i: number) => {
                const orders = Number(row.totalOrders ?? 0);
                const rev = Number(row.totalRevenue ?? 0);
                return (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-zinc-900 dark:text-white">
                      {new Date(row.reportDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">{NUM(orders)}</td>
                    <td className="px-6 py-3 text-right font-semibold text-zinc-900 dark:text-white">{THB(rev)}</td>
                    <td className="px-6 py-3 text-right text-zinc-500">{THB2(orders > 0 ? rev / orders : 0)}</td>
                  </tr>
                );
              })}
              {!isLoading && trend.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    ไม่มีข้อมูลในช่วงเวลานี้
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals row — shown on last page or when all fits */}
            {!isLoading && trend.length > 0 && (
              <tfoot className="bg-zinc-100/60 dark:bg-zinc-800/40 border-t-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <td className="px-6 py-3 font-bold text-zinc-900 dark:text-white text-sm">รวมทั้งสิ้น ({trend.length} วัน)</td>
                  <td className="px-6 py-3 text-right font-bold text-zinc-900 dark:text-white">{NUM(totalOrders)}</td>
                  <td className="px-6 py-3 text-right font-bold text-zinc-900 dark:text-white">{THB(totalRevenue)}</td>
                  <td className="px-6 py-3 text-right font-bold text-zinc-900 dark:text-white">{THB2(aov)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              หน้า {page} จาก {totalPages} ({trend.length} รายการ)
            </span>
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

              {/* Page numbers */}
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
