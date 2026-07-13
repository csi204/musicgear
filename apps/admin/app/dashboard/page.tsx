"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Package, Layers, BarChart3, ArrowRight } from "lucide-react";
import { SalesReportCharts } from "./reports/components/sales-report";
import { getAccessToken, clearSession, getApiBaseUrl } from "@/lib/auth";
import { getUsers, getProducts, getBundles } from "@/lib/api";
import { DateRangePicker } from "@/components/date-range-picker";

let CACHED_DASHBOARD: any = null;
let CACHED_TIMESTAMP = 0;
function today() { return new Date().toISOString().slice(0, 10); }

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(CACHED_DASHBOARD);
  const [isLoading, setIsLoading] = useState(!CACHED_DASHBOARD);
  
  // Default range: Jan 1st 2024 to today, matching report page
  const [range, setRange] = useState({ start: "2024-01-01", end: today() });

  const fetchData = useCallback(async (r: { start: string; end: string }) => {
    if (CACHED_DASHBOARD) {
      setData(CACHED_DASHBOARD);
    } else {
      setIsLoading(true);
    }
    
    try {
      const token = getAccessToken();
      const apiBase = getApiBaseUrl();
      const tokenStr = token || undefined;
      
      const [usersRes, productsRes, bundlesRes, reportsRes] = await Promise.all([
        getUsers({}, tokenStr).catch(() => null),
        getProducts({}, tokenStr).catch(() => null),
        getBundles(tokenStr).catch(() => null),
        fetch(`${apiBase}/reports/dashboard-summary`, {
          method: 'QUERY',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ start: new Date(r.start).toISOString(), end: new Date(r.end + "T23:59:59").toISOString() })
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      ]);

      if (reportsRes?.error === "Access Denied" || reportsRes?.status === 401 || reportsRes?.status === 403) {
        if (reportsRes?.status === 401) {
          clearSession();
          router.push("/");
          return;
        }
      }

      const dashboardData = {
          users: usersRes,
          products: productsRes,
          bundles: bundlesRes,
          reports: reportsRes,
          timestamp: Date.now()
        };

        CACHED_DASHBOARD = dashboardData;
        CACHED_TIMESTAMP = Date.now();
        setData(dashboardData);
      } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">ภาพรวมระบบ</h2>
          <p className="text-zinc-500 mt-2">ติดตามยอดขาย สถิติ และสถานะของระบบ</p>
        </div>
        <div className="flex items-center">
          <DateRangePicker onChange={(r) => setRange(r)} />
        </div>
      </div>

      {data?.error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          {data.error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Users Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div>
            <div className="flex flex-row items-center justify-between pb-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">จัดการผู้ใช้</h3>
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {data && data.users ? (
                new Intl.NumberFormat('th-TH').format(data.users.pagination?.total ?? data.users.users?.length ?? data.users.total ?? data.users.data?.length ?? 0)
              ) : (
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              ผู้ใช้งานทั้งหมดในระบบ
            </p>
          </div>
          <Link href="/dashboard/users" className="mt-5 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors z-10 w-fit">
            ดูผู้ใช้ทั้งหมด <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {/* 2. Products Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div>
            <div className="flex flex-row items-center justify-between pb-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">สินค้า (Products)</h3>
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {data && data.products ? (
                new Intl.NumberFormat('th-TH').format(data.products.pagination?.total ?? data.products.products?.length ?? data.products.total ?? data.products.data?.length ?? 0)
              ) : (
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              รายการสินค้าทั้งหมด
            </p>
          </div>
          <Link href="/dashboard/products" className="mt-5 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors z-10 w-fit">
            จัดการสินค้า <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {/* 3. Bundles Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div>
            <div className="flex flex-row items-center justify-between pb-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">เซ็ตสินค้า (Bundles)</h3>
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {data && data.bundles ? (
                new Intl.NumberFormat('th-TH').format(data.bundles.bundles?.length ?? 0)
              ) : (
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              เซ็ตสินค้าที่สร้างแล้ว
            </p>
          </div>
          <Link href="/dashboard/bundles" className="mt-5 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors z-10 w-fit">
            ดูเซ็ตสินค้า <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {/* 4. Reports Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div>
            <div className="flex flex-row items-center justify-between pb-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">รายงานยอดขาย</h3>
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {data && Array.isArray(data.reports?.salesTrend) ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(
                data.reports.salesTrend.reduce((acc: number, cur: any) => acc + Number(cur.totalRevenue), 0)
              ) : (
                <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              ยอดรับรวมในช่วงเวลาที่เลือก
            </p>
          </div>
          <Link href="/dashboard/reports" className="mt-5 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors z-10 w-fit">
            ดูรายงานยอดขาย <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Sales Trend</h3>
            <p className="text-sm text-zinc-500 mt-1">แนวโน้มยอดขายในช่วงเวลาที่เลือก</p>
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
          {isLoading ? null : <SalesReportCharts data={data?.reports} range={range} />}
        </div>
      </div>
    </div>
  );
}
