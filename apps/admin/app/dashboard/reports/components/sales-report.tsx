"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";

interface SalesReportChartsProps {
  data: any;
}

export function SalesReportCharts({ data }: SalesReportChartsProps) {
  if (!data) return <div className="text-muted-foreground p-8">กำลังโหลดข้อมูล...</div>;

  const chartData = data.salesTrend.map((d: any) => ({
    name: new Date(d.reportDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    totalRevenue: Number(d.totalRevenue),
  }));

  return (
    <div className="w-full flex flex-col gap-8 py-4">
      <div className="h-[300px] w-full">
        <h3 className="text-lg font-semibold mb-4">แนวโน้มยอดขาย</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2F5DFF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2F5DFF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
            <Tooltip contentStyle={{ borderRadius: '8px' }} />
            <Area type="monotone" dataKey="totalRevenue" stroke="#2F5DFF" fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">สินค้าขายดี (Top 5)</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สินค้า</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-right">จำนวนขาย</TableHead>
              <TableHead className="text-right">ยอดรับ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topProducts.map((p: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{p.productName}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell className="text-right">{p.quantitySold}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(p.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
