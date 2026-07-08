"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ScanLine, TrendingDown, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";

const kpis = [
  { label: "TOTAL PENDING", value: "142", delta: "+12", deltaUp: true, icon: Clock },
  { label: "IN PICKING", value: "28", sub: "Active carts", icon: ScanLine },
  { label: "AVG FULFILLMENT", value: "14m", delta: "-2m", deltaUp: false, icon: TrendingDown },
];

type OrderStatus = "pending" | "confirmed" | "packing" | "shipped" | "delivered" | "overdue";

const orders: { id: string; customer: string; address: string; items: { name: string; qty: number }[]; status: OrderStatus; time: string }[] = [
  { id: "MG-10241", customer: "Sarah Jenkins", address: "Zone C / Rack 4", items: [{ name: "Acoustic Guitar", qty: 1 }, { name: "Guitar Stand", qty: 1 }], status: "pending", time: "5m ago" },
  { id: "MG-10240", customer: "David Miller", address: "Zone A / Shelf 2", items: [{ name: "MIDI Keyboard Pro 49", qty: 1 }], status: "packing", time: "18m ago" },
  { id: "MG-10239", customer: "Elena Rodriguez", address: "Zone B / Rack 7", items: [{ name: "Drum Sticks (Pair)", qty: 2 }, { name: "Practice Pad", qty: 1 }, { name: "Drum Bag", qty: 1 }], status: "shipped", time: "32m ago" },
  { id: "MG-10238", customer: "Michael Chang", address: "Zone D / Bay 1", items: [{ name: "Bass Amplifier 50W", qty: 1 }], status: "overdue", time: "1h 12m ago" },
  { id: "MG-10237", customer: "Lisa Thomson", address: "Zone A / Shelf 9", items: [{ name: "XLR Cable 3m", qty: 3 }, { name: "Microphone Stand", qty: 1 }], status: "delivered", time: "2h ago" },
  { id: "MG-10236", customer: "Chris Anderson", address: "Zone C / Rack 2", items: [{ name: "Focusrite 2i2 Gen4", qty: 1 }], status: "confirmed", time: "2h 30m ago" },
  { id: "MG-10235", customer: "Yui Tanaka", address: "Zone B / Rack 5", items: [{ name: "Shure SM7B Microphone", qty: 1 }], status: "shipped", time: "3h ago" },
];

const statusConfig: Record<OrderStatus, { label: string; dot: string; badge: string }> = {
  pending: { label: "Pending", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  confirmed: { label: "Confirmed", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  packing: { label: "Packing", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  shipped: { label: "Shipped", dot: "bg-sky-500", badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  delivered: { label: "Delivered", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  overdue: { label: "Overdue", dot: "bg-red-500 animate-pulse", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const actionLabels: Record<OrderStatus, string> = {
  pending: "REVIEW",
  confirmed: "START PICK",
  packing: "MARK PACKED",
  shipped: "TRACK",
  delivered: "VIEW",
  overdue: "URGENT",
};

const tabs = [
  { key: "all", label: "All Open" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue (5)" },
  { key: "shipped", label: "SHIPPING (12)" },
  { key: "delivered", label: "DELIVERED (20)" },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o) => {
    const matchTab = activeTab === "all" || o.status === activeTab;
    const matchSearch = search === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Orders Management</h2>
          <p className="text-zinc-500 text-sm mt-1">Live feed of warehouse fulfillment queue.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-colors">
          <ScanLine className="w-4 h-4" />
          Scan Mode
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 tracking-widest">{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{kpi.value}</span>
                {kpi.delta && (
                  <span className={`text-sm font-bold mb-1 flex items-center gap-0.5 ${kpi.deltaUp ? "text-red-500" : "text-emerald-500"}`}>
                    {kpi.deltaUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {kpi.delta}
                  </span>
                )}
                {kpi.sub && <span className="text-sm text-zinc-400 mb-1">{kpi.sub}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters + Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 pt-4 pb-0 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="ค้นหาออเดอร์ หรือชื่อลูกค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab.key
                    ? "text-amber-600 dark:text-amber-400 border-amber-500"
                    : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold pl-6">ORDER ID</TableHead>
              <TableHead className="font-bold">CUSTOMER NAME</TableHead>
              <TableHead className="font-bold">ITEMS</TableHead>
              <TableHead className="font-bold">STATUS</TableHead>
              <TableHead className="font-bold">TIME</TableHead>
              <TableHead className="font-bold text-right pr-6">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-zinc-400">ไม่พบออเดอร์ที่ตรงกับเงื่อนไข</TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => {
                const sc = statusConfig[order.status];
                const actionLabel = actionLabels[order.status];
                return (
                  <TableRow key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="font-bold text-zinc-900 dark:text-white pl-6 font-mono text-sm">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{order.customer}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{order.address}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="space-y-0.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">×{item.qty}</span> {item.name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">{order.time}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                          order.status === "overdue"
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        }`}
                      >
                        {actionLabel}
                      </Link>
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
