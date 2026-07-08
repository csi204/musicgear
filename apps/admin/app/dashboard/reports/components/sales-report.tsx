"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SalesReportChartsProps {
  data: any;
}

export function SalesReportCharts({ data }: SalesReportChartsProps) {
  if (!data || !data.salesTrend && !data.salesTrends) return <div className="text-zinc-500 font-medium p-8 flex items-center justify-center h-full">ไม่มีข้อมูลการขายในช่วงเวลานี้</div>;

  const trendData = data.salesTrend || data.salesTrends;

  const chartData = Array.isArray(trendData) ? trendData.map((d: any) => ({
    name: d.reportDate ? new Date(d.reportDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : d.name,
    totalRevenue: Number(d.totalRevenue),
  })) : [];

  return (
    <div className="w-full h-full flex items-center justify-center pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value), 'Revenue']}
          />
          <Area type="monotone" dataKey="totalRevenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
