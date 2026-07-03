"use client";

import Link from "next/link";
import { TrendingUp, DollarSign, Package } from "lucide-react";

export default function ReportsIndex() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">รายงาน (Reports)</h2>
        <p className="text-muted-foreground mt-1">เลือกประเภทของรายงานที่คุณต้องการดู หรือส่งออกเป็นเอกสาร</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/reports/sales" className="block group">
          <div className="bg-background border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
            <div className="p-3 bg-blue-500/10 w-fit rounded-lg text-blue-500 mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">รายงานยอดขาย (Sales Report)</h3>
            <p className="text-sm text-muted-foreground">ดูแนวโน้มยอดขาย สินค้าขายดี และสัดส่วนยอดขายตามหมวดหมู่ พร้อมส่งออก PDF</p>
          </div>
        </Link>

        <Link href="/dashboard/reports/financial" className="block group">
          <div className="bg-background border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
            <div className="p-3 bg-emerald-500/10 w-fit rounded-lg text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">รายงานรายรับ (Financial Report)</h3>
            <p className="text-sm text-muted-foreground">สรุปรายรับ (Revenue) แบ่งตามช่องทาง และสรุปตัวเลขทางการเงินต่างๆ</p>
          </div>
        </Link>

        <Link href="/dashboard/reports/inventory" className="block group">
          <div className="bg-background border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
            <div className="p-3 bg-amber-500/10 w-fit rounded-lg text-amber-500 mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">รายงานคลังสินค้า (Inventory Report)</h3>
            <p className="text-sm text-muted-foreground">ตรวจสอบสินค้าใกล้หมดสต็อก (Low Stock Alerts) และความเคลื่อนไหวคลัง</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
