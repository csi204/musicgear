"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus, Lock } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";

type ProductStatus = "active" | "out_of_stock" | "discontinued";

const products: {
  id: string; name: string; sku: string; category: string; brand: string;
  price: number; stock: number; reserved: number; status: ProductStatus;
}[] = [
  { id: "1", name: "Stratocaster Pro II", sku: "GTR-001", category: "Electric Guitars", brand: "Fender", price: 1499, stock: 42, reserved: 3, status: "active" },
  { id: "2", name: "Beginner Acoustic Guitar", sku: "GTR-AC-001", category: "Acoustic Guitars", brand: "Yamaha", price: 249, stock: 45, reserved: 12, status: "active" },
  { id: "3", name: "15W Practice Amp", sku: "AMP-PR-015", category: "Amplifiers", brand: "Fender", price: 129, stock: 12, reserved: 8, status: "active" },
  { id: "4", name: "Focusrite Scarlett 2i2 Gen 4", sku: "FR-SC2I2-G4", category: "Audio Interfaces", brand: "Focusrite", price: 169, stock: 0, reserved: 0, status: "out_of_stock" },
  { id: "5", name: "Shure SM7B Dynamic Microphone", sku: "SH-SM7B-STD", category: "Microphones", brand: "Shure", price: 399, stock: 8, reserved: 2, status: "active" },
  { id: "6", name: "Yamaha HS8 Studio Monitor", sku: "YM-HS8-BLK", category: "Studio Monitors", brand: "Yamaha", price: 699, stock: 6, reserved: 1, status: "active" },
  { id: "7", name: "Folding Stand (Heavy Duty)", sku: "ACC-ST-009", category: "Accessories", brand: "Hercules", price: 49, stock: 2, reserved: 2, status: "active" },
  { id: "8", name: "Roland TD-17KVX Drum Kit", sku: "RLD-TD17KVX", category: "Drums", brand: "Roland", price: 1899, stock: 0, reserved: 0, status: "discontinued" },
];

const statusConfig: Record<ProductStatus, { label: string; badge: string; dot: string }> = {
  active: { label: "IN STOCK", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  out_of_stock: { label: "OUT OF STOCK", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  discontinued: { label: "DISCONTINUED", badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", dot: "bg-zinc-400" },
};

function StockBar({ stock, reserved }: { stock: number; reserved: number }) {
  const max = 50;
  const availPct = Math.min((stock - reserved) / max, 1) * 100;
  const reservedPct = Math.min(reserved / max, 1) * 100;
  const isLow = stock - reserved <= 5 && stock > 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex">
        <div className={`h-full rounded-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${availPct}%` }} />
        <div className="h-full bg-blue-400/50" style={{ width: `${reservedPct}%` }} />
      </div>
      <span className={`text-sm font-bold ${isLow ? "text-amber-600 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200"}`}>{stock - reserved}</span>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Products</h2>
          <p className="text-zinc-500 text-sm mt-1">ดูสินค้าและสถานะสต็อก — การแก้ไขราคา/เพิ่มสินค้าต้องทำผ่าน Admin</p>
        </div>
        {/* Staff cannot add products — show disabled button */}
        <button
          disabled
          title="ต้องการสิทธิ์ Admin เพื่อเพิ่มสินค้า"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-sm font-semibold cursor-not-allowed opacity-60"
        >
          <Lock className="w-4 h-4" />
          <Plus className="w-4 h-4" />
          เพิ่มสินค้า (Admin Only)
        </button>
      </div>

      {/* Main table card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า, SKU, แบรนด์..."
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

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold pl-6">Product</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Brand</TableHead>
              <TableHead className="font-bold">Price</TableHead>
              <TableHead className="font-bold">Available Stock</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400">ไม่พบสินค้าที่ตรงกับการค้นหา</TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const sc = statusConfig[p.status === "active" && p.stock - p.reserved <= 5 && p.stock > 0 ? "active" : p.status];
                const lowStock = p.status === "active" && (p.stock - p.reserved) <= 5 && p.stock > 0;
                return (
                  <TableRow key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        {/* Product thumbnail placeholder */}
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">{p.brand.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{p.name}</div>
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">SKU: {p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{p.brand}</TableCell>
                    <TableCell className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      ${p.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StockBar stock={p.stock} reserved={p.reserved} />
                      {lowStock && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 block">⚠ LOW STOCK</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${lowStock ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lowStock ? "bg-amber-500" : sc.dot}`} />
                        {lowStock ? "LOW STOCK" : sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors">
                        ดูรายละเอียด
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
