"use client";

import { useState } from "react";
import { Package, AlertTriangle, AlertCircle } from "lucide-react";

export default function InventoryReportPage() {
  const [showAll, setShowAll] = useState(false);

  // Mock Low Stock Data
  const lowStockItems = [
    { id: 1, name: "Korg Minilogue XD", stock: 1, status: "Critical", threshold: 5 },
    { id: 2, name: "Gibson Les Paul Standard", stock: 2, status: "Critical", threshold: 3 },
    { id: 3, name: "Ableton Push 3", stock: 4, status: "Critical", threshold: 10 },
    { id: 4, name: "Akai MPK Mini Mk3", stock: 5, status: "Low", threshold: 15 },
    { id: 5, name: "Audio-Technica ATH-M50x", stock: 8, status: "Low", threshold: 20 },
    { id: 6, name: "Yamaha Pacifica 112V", stock: 9, status: "Low", threshold: 15 },
    { id: 7, name: "Rode NT1-A", stock: 12, status: "Low", threshold: 20 },
    { id: 8, name: "Fender Player Telecaster", stock: 14, status: "Low", threshold: 20 },
    { id: 9, name: "Focusrite Clarett", stock: 3, status: "Critical", threshold: 5 },
    { id: 10, name: "Shure SM58", stock: 6, status: "Low", threshold: 50 },
  ];

  const visibleItems = showAll ? lowStockItems.slice(0, 10) : lowStockItems.slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">รายงานคลังสินค้า (Inventory)</h2>
        <p className="text-muted-foreground mt-1">ตรวจสอบสินค้าคงคลัง และการแจ้งเตือนสินค้าใกล้หมด</p>
      </div>

      <div className="bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-md">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">สินค้าใกล้หมดสต็อก (Low Stock Alerts)</h3>
          </div>
          {!showAll && (
            <button 
              onClick={() => setShowAll(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              ดูทั้งหมด (View all)
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">ชื่อสินค้า</th>
                <th className="px-6 py-4 text-right">จำนวนคงเหลือ</th>
                <th className="px-6 py-4 text-right">จุดสั่งซื้อ (Threshold)</th>
                <th className="px-6 py-4">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                  <td className="px-6 py-4 text-right font-bold">{item.stock}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">{item.threshold}</td>
                  <td className="px-6 py-4">
                    {item.status === "Critical" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50">
                        <AlertTriangle className="w-3 h-3" />
                        วิกฤต (Critical)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50">
                        <AlertCircle className="w-3 h-3" />
                        เหลือน้อย (Low)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination like other pages */}
        {showAll && (
          <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
            <div>แสดงผล 1 ถึง 10 จาก 42 รายการ</div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50" disabled>ก่อนหน้า</button>
              <button className="px-3 py-1 border rounded bg-primary text-primary-foreground">1</button>
              <button className="px-3 py-1 border rounded hover:bg-muted">2</button>
              <button className="px-3 py-1 border rounded hover:bg-muted">3</button>
              <span className="px-2">...</span>
              <button className="px-3 py-1 border rounded hover:bg-muted">ถัดไป</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
