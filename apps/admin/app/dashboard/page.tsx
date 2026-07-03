"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, ShoppingBag, Tag } from "lucide-react";

// Types
type SalesData = {
  salesTrends: any[];
  topSellingGear: any[];
  categoryDistribution: any[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardOverview() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from report-svc
    // const res = await fetch('http://localhost:8787/reports/sales?...');
    
    // Mocking the data based on our seed script for immediate UI display
    setTimeout(() => {
      setData({
        salesTrends: [
          { name: "Mon", totalRevenue: 12000 },
          { name: "Tue", totalRevenue: 15000 },
          { name: "Wed", totalRevenue: 8000 },
          { name: "Thu", totalRevenue: 22000 },
          { name: "Fri", totalRevenue: 18000 },
          { name: "Sat", totalRevenue: 25000 },
          { name: "Sun", totalRevenue: 20000 },
        ],
        topSellingGear: [
          { productName: "Fender Stratocaster", sold: 124 },
          { productName: "Roland Jupiter-X", sold: 98 },
          { productName: "Shure SM7B", sold: 82 },
          { productName: "Focusrite Scarlett", sold: 65 },
          { productName: "Yamaha HS8", sold: 45 },
        ],
        categoryDistribution: [
          { category: "Guitars", value: 45 },
          { category: "Keyboards", value: 25 },
          { category: "Microphones", value: 15 },
          { category: "Audio Interfaces", value: 10 },
          { category: "Monitors", value: 5 },
        ]
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !data) return <div className="p-8 flex justify-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">ภาพรวมระบบ</h2>
        <p className="text-muted-foreground mt-1">สรุปข้อมูลยอดขาย สมาชิก และสินค้า</p>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">ยอดขายรวม</span>
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">฿124,500</h3>
            <p className="text-xs text-emerald-500 font-medium mt-1">+12.5% เทียบกับเดือนที่แล้ว</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">ผู้ใช้ใหม่</span>
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">842</h3>
            <p className="text-xs text-emerald-500 font-medium mt-1">+5.2% เทียบกับเดือนที่แล้ว</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">คำสั่งซื้อวันนี้</span>
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">47</h3>
            <p className="text-xs text-muted-foreground mt-1">ต้องตรวจสอบ 3 รายการ</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">หมวดหมู่ยอดนิยม</span>
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mt-2">Guitars</h3>
            <p className="text-xs text-muted-foreground mt-2">คิดเป็น 45% ของยอดขาย</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trends Chart */}
        <div className="lg:col-span-2 bg-background rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6">แนวโน้มยอดขาย</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} tickFormatter={(value) => `฿${value/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดขาย']}
                />
                <Line type="monotone" dataKey="totalRevenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Selling Gear */}
          <div className="bg-background rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">สินค้าขายดี</h3>
            <div className="space-y-4">
              {data.topSellingGear.map((item, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate pr-2">{item.productName}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{item.sold} ชิ้น</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(item.sold / data.topSellingGear[0].sold) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-background rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">สัดส่วนตามหมวดหมู่</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, 'สัดส่วน']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {data.categoryDistribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
