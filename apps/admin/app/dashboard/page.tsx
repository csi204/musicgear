"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { SalesReportCharts } from "./reports/components/sales-report";
import { getAccessToken, clearSession, getApiBaseUrl } from "@/lib/auth";

let CACHED_DASHBOARD: any = null;
let CACHED_TIMESTAMP = 0;
const CACHE_TTL = 30000; // 30 seconds cache for instant tab switching

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(CACHED_DASHBOARD);
  const [isLoading, setIsLoading] = useState(!CACHED_DASHBOARD);

  // Fetch from API Gateway (report-svc)
  useEffect(() => {
    const fetchData = async () => {
      if (CACHED_DASHBOARD && (Date.now() - CACHED_TIMESTAMP < CACHE_TTL)) {
        setData(CACHED_DASHBOARD);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30); // Default to 30 days for overview

      try {
        const token = getAccessToken();
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/reports/dashboard-summary`, {
          method: 'QUERY',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() })
        });

        if (!res.ok) {
          if (res.status === 401) {
            clearSession();
            router.push("/");
            return;
          }
          if (res.status === 403) {
            setData({ error: "Access Denied: You do not have permission to view this dashboard." });
            return;
          }
          throw new Error(`API returned ${res.status}`);
        }

        const json = await res.json();
        CACHED_DASHBOARD = json;
        CACHED_TIMESTAMP = Date.now();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">ภาพรวมระบบ</h2>
          <p className="text-zinc-500 mt-2">ติดตามยอดขาย สถิติ และสถานะของระบบ</p>
        </div>
      </div>

      {data?.error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          {data.error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ยอดรับทั้งหมด (30 วัน)</h3>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <span className="font-bold text-lg">฿</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">
              {data && Array.isArray(data.salesTrend) ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(
                data.salesTrend.reduce((acc: number, cur: any) => acc + Number(cur.totalRevenue), 0)
              ) : (
                <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              )}
            </div>
            <p className="text-xs text-emerald-600 flex items-center mt-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
              ข้อมูลล่าสุด
            </p>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">คำสั่งซื้อ (30 วัน)</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">
              {data && Array.isArray(data.salesTrend) ? new Intl.NumberFormat('th-TH').format(
                data.salesTrend.reduce((acc: number, cur: any) => acc + Number(cur.totalOrders), 0)
              ) : (
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              )}
            </div>
            <p className="text-xs text-emerald-600 flex items-center mt-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
              อัปเดตเรียบร้อย
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Sales Trend</h3>
            <p className="text-sm text-zinc-500 mt-1">แนวโน้มยอดขายในช่วง 30 วันที่ผ่านมา</p>
          </div>
          {isLoading && (
            <div className="flex gap-1 items-center px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          )}
        </div>
        <div className="p-8 h-[450px] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-grid-zinc-900/[0.02] dark:bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
          {isLoading ? null : <SalesReportCharts data={data} />}
        </div>
      </div>
    </div>
  );
}
