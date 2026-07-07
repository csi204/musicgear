"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, PackagePlus } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const inventory: {
  sku: string; name: string; category: string; currentQty: number; reserved: number; status: StockStatus;
}[] = [
  { sku: "GTR-AC-001", name: "Beginner Acoustic Guitar", category: "Guitars", currentQty: 45, reserved: 12, status: "in_stock" },
  { sku: "AMP-PR-015", name: "15W Practice Amp", category: "Amps", currentQty: 12, reserved: 8, status: "low_stock" },
  { sku: "ACC-ST-009", name: "Folding Stand (Heavy Duty)", category: "Accessories", currentQty: 2, reserved: 2, status: "low_stock" },
  { sku: "GTR-001", name: "Stratocaster Pro II", category: "Guitars", currentQty: 42, reserved: 3, status: "in_stock" },
  { sku: "FR-SC2I2-G4", name: "Focusrite Scarlett 2i2 Gen 4", category: "Accessories", currentQty: 0, reserved: 0, status: "out_of_stock" },
  { sku: "SH-SM7B-STD", name: "Shure SM7B Dynamic Microphone", category: "Accessories", currentQty: 8, reserved: 2, status: "in_stock" },
  { sku: "YM-HS8-BLK", name: "Yamaha HS8 Studio Monitor", category: "Accessories", currentQty: 6, reserved: 1, status: "low_stock" },
  { sku: "RLD-TD17KVX", name: "Roland TD-17KVX Drum Kit", category: "Accessories", currentQty: 0, reserved: 0, status: "out_of_stock" },
];

const statusConfig: Record<StockStatus, { label: string; badge: string; dot: string }> = {
  in_stock: { label: "IN STOCK", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  low_stock: { label: "LOW STOCK", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  out_of_stock: { label: "OUT OF STOCK", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
};

const filterTabs = ["All Items", "Guitars", "Amps", "Accessories"];

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [search, setSearch] = useState("");

  const filtered = inventory.filter((item) => {
    const matchCat = activeCategory === "All Items" || item.category === activeCategory;
    const matchSearch = search === "" ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Inventory Management</h2>
          <p className="text-zinc-500 text-sm mt-1">ตรวจสอบและจัดการสต็อกคลังสินค้า</p>
        </div>
        <Link
          href="/dashboard/inventory/receive"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
        >
          <PackagePlus className="w-4 h-4" />
          Receive Stock
        </Link>
      </div>

      {/* Main card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="ค้นหา SKU หรือชื่อสินค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
            <span className="text-xs text-zinc-400 ml-auto">{filtered.length} รายการ</span>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-px">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                  activeCategory === tab
                    ? "text-amber-600 dark:text-amber-400 border-amber-500"
                    : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold pl-6">SKU</TableHead>
              <TableHead className="font-bold">PRODUCT NAME</TableHead>
              <TableHead className="font-bold text-center">CURRENT QTY</TableHead>
              <TableHead className="font-bold text-center">RESERVED</TableHead>
              <TableHead className="font-bold text-center">AVAILABLE QTY</TableHead>
              <TableHead className="font-bold">STATUS</TableHead>
              <TableHead className="font-bold text-right pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400">ไม่พบสินค้าที่ตรงกับเงื่อนไข</TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const available = item.currentQty - item.reserved;
                const sc = statusConfig[item.status];
                return (
                  <TableRow key={item.sku} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="pl-6 font-mono text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.sku}</TableCell>
                    <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">{item.name}</TableCell>
                    <TableCell className="text-center font-bold text-zinc-900 dark:text-white">{item.currentQty}</TableCell>
                    <TableCell className="text-center text-blue-600 dark:text-blue-400 font-semibold">{item.reserved}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-lg ${available === 0 ? "text-red-500" : available <= 5 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {available}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors">
                        ดูประวัติ
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
