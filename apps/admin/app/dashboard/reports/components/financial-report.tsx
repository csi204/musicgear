"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FinancialReportChartsProps {
  data: any;
}

export function FinancialReportCharts({ data }: FinancialReportChartsProps) {
  if (!data) return <div className="text-muted-foreground p-8">กำลังโหลดข้อมูล...</div>;

  const totalRevenue = data.salesTrend.reduce((sum: number, item: any) => sum + Number(item.totalRevenue), 0);
  const totalOrders = data.salesTrend.reduce((sum: number, item: any) => sum + Number(item.totalOrders), 0);

  const chartData = data.salesTrend.map((d: any) => ({
    name: new Date(d.reportDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    totalRevenue: Number(d.totalRevenue),
  }));

  return (
    <div className="w-full flex flex-col gap-8 py-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">ยอดรับรวม</h3>
          <div className="text-2xl font-bold mt-2">
            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalRevenue)}
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">จำนวนออร์เดอร์รวม</h3>
          <div className="text-2xl font-bold mt-2">
            {new Intl.NumberFormat('th-TH').format(totalOrders)}
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <h3 className="text-lg font-semibold mb-4">ยอดรับรายวัน</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
            <Tooltip contentStyle={{ borderRadius: '8px' }} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="totalRevenue" fill="#2BBF7A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
