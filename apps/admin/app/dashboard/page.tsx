"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { SalesReportCharts } from "./reports/components/sales-report";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from API Gateway (report-svc)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30); // Default to 30 days for overview

      try {
        const res = await fetch(`http://localhost:8787/reports/dashboard-summary`, {
          method: 'QUERY',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() })
        });
        const json = await res.json();
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
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ภาพรวมระบบ (Overview)</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดรับทั้งหมด (30 วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                data.salesTrend.reduce((acc: number, cur: any) => acc + Number(cur.totalRevenue), 0)
              ) : "..."}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำสั่งซื้อ (30 วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? data.salesTrend.reduce((acc: number, cur: any) => acc + Number(cur.totalOrders), 0) : "..."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>
            แนวโน้มยอดขายในช่วง 30 วันที่ผ่านมา
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border-t border-muted pb-12 overflow-y-auto">
          {isLoading ? <p>Loading...</p> : <SalesReportCharts data={data} />}
        </CardContent>
      </Card>
    </div>
  );
}
