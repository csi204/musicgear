"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

interface InventoryReportChartsProps {
  data: any;
}

export function InventoryReportCharts({ data }: InventoryReportChartsProps) {
  const [alertsLimit, setAlertsLimit] = useState(5);

  if (!data || !data.inventory) return <div className="text-muted-foreground p-8">กำลังโหลดข้อมูล...</div>;

  const { health, byCategory, alerts } = data.inventory;

  const criticalCount = health.find((h: any) => h.name === 'Critical')?.value || 0;
  const lowCount = health.find((h: any) => h.name === 'Low Stock')?.value || 0;

  const visibleAlerts = alerts.slice(0, alertsLimit);

  return (
    <div className="w-full flex flex-col gap-8 py-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 border-red-500/20">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">สินค้าหมด (Out of Stock)</h3>
          <div className="text-2xl font-bold mt-2 text-red-500">{criticalCount} รายการ</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 border-orange-500/20">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">สินค้าใกล้หมด (Low Stock)</h3>
          <div className="text-2xl font-bold mt-2 text-orange-500">{lowCount} รายการ</div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Stock Health Donut Chart */}
        <div className="h-[300px]">
          <h3 className="text-lg font-semibold mb-4 text-center">สถานะคลังสินค้า</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={health}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {health.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Levels By Category Bar Chart */}
        <div className="h-[300px]">
          <h3 className="text-lg font-semibold mb-4 text-center">ระดับสต็อกตามหมวดหมู่</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.2} />
              <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="category" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px' }} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="stockLevel" fill="#2F5DFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alerts Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">รายการแจ้งเตือนสต็อก</h3>
          {alerts.length > 5 && (
            <Button variant="outline" size="sm" onClick={() => setAlertsLimit(alertsLimit === 5 ? 10 : 5)}>
              {alertsLimit === 5 ? "ดูทั้งหมด (ขยาย 10 แถว)" : "ย่อกลับ"}
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สินค้า</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="text-right">สต็อกปัจจุบัน</TableHead>
              <TableHead className="text-right">จุดสั่งซื้อ</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAlerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ไม่มีรายการแจ้งเตือน</TableCell>
              </TableRow>
            )}
            {visibleAlerts.map((item: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">{item.stockLevel}</TableCell>
                <TableCell className="text-right">{item.reorderPoint}</TableCell>
                <TableCell>
                  {item.status === 'Critical' ? (
                    <Badge variant="destructive">🔴 หมดสต็อก</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">🟠 ใกล้หมด</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
