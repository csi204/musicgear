"use client";

import { useState, useEffect, useCallback } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { ExportReportButton } from "@/components/export-report-button";
import { SalesReportCharts } from "../components/sales-report";
import { getAccessToken, getApiBaseUrl, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

function today() { return new Date().toISOString().slice(0, 10); }
const THB = (n: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);
const NUM = (n: number) => new Intl.NumberFormat("th-TH").format(n);

export default function SalesReportPage() {
  const router = useRouter();
  const [range, setRange] = useState({ start: "2024-01-01", end: today() });
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: { start: string; end: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/reports/dashboard-summary?start=${new Date(r.start).toISOString()}&end=${new Date(r.end + "T23:59:59").toISOString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.status === 401) { clearSession(); router.push("/"); return; }
      if (!res.ok) throw new Error(`ข้อผิดพลาด ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const trend = data?.salesTrend ?? [];
  const totalRevenue = trend.reduce((s: number, r: any) => s + Number(r.totalRevenue ?? 0), 0);
  const totalOrders = trend.reduce((s: number, r: any) => s + Number(r.totalOrders ?? 0), 0);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      {/* Title + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">ยอดขายและประสิทธิภาพ</h3>
          <p className="text-sm text-zinc-500 mt-0.5">ข้อมูลจากฐานข้อมูลจริง อัปเดตตามช่วงเวลาที่เลือก</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker onChange={(r) => setRange(r)} />
          <ExportReportButton reportType="sales" data={data} onRangeChange={setRange} />
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
          { label: "คำสั่งซื้อทั้งหมด", value: `${NUM(totalOrders)} รายการ` },
          { label: "มูลค่าเฉลี่ยต่อรายการ", value: THB(aov) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">{kpi.label}</p>
            <h4 className={`text-2xl font-bold mt-2 text-zinc-900 dark:text-white ${isLoading ? "animate-pulse opacity-40" : ""}`}>
              {isLoading ? "..." : kpi.value}
            </h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">แนวโน้มรายรับ</h4>
              <p className="text-xs text-zinc-500">ยอดขายรายวัน</p>
            </div>
            {isLoading && (
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            )}
          </div>
          <div className="flex-1 p-4">
            {!isLoading && data ? <SalesReportCharts data={data} /> : (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                {isLoading ? "กำลังโหลด..." : "ไม่มีข้อมูล"}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">สินค้าขายดี</h4>
            <p className="text-xs text-zinc-500">อันดับจากยอดขาย</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {data?.topProducts?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <span className="text-xs font-bold text-zinc-400 w-5 text-center">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.productName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{NUM(item.quantitySold)} ชิ้น</p>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white text-right">
                  {THB(Number(item.revenue ?? 0))}
                </span>
              </div>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && !isLoading && (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm p-6">
                ไม่มีข้อมูลสินค้าในช่วงเวลานี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
