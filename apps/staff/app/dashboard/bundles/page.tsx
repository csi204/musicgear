"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Package, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";

type BundleStatus = "healthy" | "low_component" | "out_of_stock";

interface BundleComponent {
  sku: string;
  name: string;
  required: number;
  available: number;
}

interface Bundle {
  id: string;
  name: string;
  sku: string;
  components: BundleComponent[];
  assembled: number;
  status: BundleStatus;
}

const bundles: Bundle[] = [
  {
    id: "1", name: "Beginner Guitar Starter Kit", sku: "BND-GTR-STR-001",
    components: [
      { sku: "GTR-AC-001", name: "Acoustic Guitar", required: 1, available: 45 },
      { sku: "ACC-ST-009", name: "Guitar Stand", required: 1, available: 2 },
      { sku: "ACC-PKG-STR", name: "String Pack", required: 1, available: 80 },
    ],
    assembled: 12, status: "low_component",
  },
  {
    id: "2", name: "Home Studio Essential Pack", sku: "BND-STUDIO-001",
    components: [
      { sku: "FR-SC2I2-G4", name: "Focusrite 2i2 Gen4", required: 1, available: 0 },
      { sku: "SH-SM7B-STD", name: "Shure SM7B Mic", required: 1, available: 8 },
      { sku: "ACC-XLR-3M", name: "XLR Cable 3m", required: 2, available: 35 },
    ],
    assembled: 3, status: "out_of_stock",
  },
  {
    id: "3", name: "Live Performance Rig", sku: "BND-LIVE-001",
    components: [
      { sku: "GTR-001", name: "Stratocaster Pro II", required: 1, available: 42 },
      { sku: "AMP-PR-015", name: "Practice Amp 15W", required: 1, available: 4 },
      { sku: "ACC-CABLE-6M", name: "Guitar Cable 6m", required: 1, available: 60 },
    ],
    assembled: 7, status: "healthy",
  },
  {
    id: "4", name: "Podcast Starter Kit", sku: "BND-PODCAST-001",
    components: [
      { sku: "SH-SM7B-STD", name: "Shure SM7B Mic", required: 1, available: 8 },
      { sku: "ACC-ST-DESK", name: "Desk Mic Stand", required: 1, available: 20 },
      { sku: "ACC-XLR-3M", name: "XLR Cable 3m", required: 1, available: 35 },
    ],
    assembled: 5, status: "healthy",
  },
];

const statusConfig: Record<BundleStatus, { label: string; badge: string; dot: string; icon: React.ReactNode }> = {
  healthy: {
    label: "Healthy",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  low_component: {
    label: "Low Component",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  out_of_stock: {
    label: "Stock Issue",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

function getPotentialBuild(bundle: Bundle): number {
  const mins = bundle.components.map((c) => Math.floor(c.available / c.required));
  return Math.min(...mins);
}

export default function BundlesPage() {
  const [search, setSearch] = useState("");

  const filtered = bundles.filter((b) =>
    search === "" ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = bundles.length;
  const healthy = bundles.filter((b) => b.status === "healthy").length;
  const stockIssues = bundles.filter((b) => b.status !== "healthy").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Bundle Sets Management</h2>
          <p className="text-zinc-500 text-sm mt-1">Track assembled kits and component availability</p>
        </div>
        <button
          disabled
          title="ต้องการสิทธิ์ Admin เพื่อสร้าง Bundle ใหม่"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-sm font-semibold cursor-not-allowed opacity-60"
        >
          <Package className="w-4 h-4" />
          Create New Bundle (Admin Only)
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 tracking-widest">TOTAL ACTIVE BUNDLES</span>
            <Package className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-4xl font-extrabold text-zinc-900 dark:text-white">{totalActive}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 tracking-widest">HEALTHY BUNDLES</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-4xl font-extrabold text-emerald-500">{healthy}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 tracking-widest">STOCK ISSUES</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-extrabold text-red-500">{stockIssues}</p>
            <p className="text-sm text-zinc-400 mb-1">require attention</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Inventory Overview</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search bundles, SKUs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-60"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold pl-6">BUNDLE INFO</TableHead>
              <TableHead className="font-bold">STATUS</TableHead>
              <TableHead className="font-bold text-center">ASSEMBLED</TableHead>
              <TableHead className="font-bold text-center">POTENTIAL BUILD</TableHead>
              <TableHead className="font-bold text-right pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-zinc-400">ไม่พบเซ็ตสินค้าที่ตรงกัน</TableCell>
              </TableRow>
            ) : (
              filtered.map((bundle) => {
                const sc = statusConfig[bundle.status];
                const potential = getPotentialBuild(bundle);
                return (
                  <TableRow key={bundle.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-bold text-zinc-900 dark:text-white text-sm">{bundle.name}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">{bundle.sku}</div>
                      <div className="mt-2 space-y-1">
                        {bundle.components.map((comp) => (
                          <div key={comp.sku} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${comp.available === 0 ? "bg-red-500" : comp.available < comp.required * 5 ? "bg-amber-500" : "bg-emerald-500"}`} />
                            <span className="text-zinc-500 dark:text-zinc-400">×{comp.required} {comp.name}</span>
                            <span className={`ml-auto font-semibold ${comp.available === 0 ? "text-red-500" : "text-zinc-600 dark:text-zinc-300"}`}>
                              ({comp.available} avail.)
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={`text-[10px] px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${sc.badge}`}>
                        {sc.icon}
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4 font-bold text-zinc-900 dark:text-white text-lg">{bundle.assembled}</TableCell>
                    <TableCell className="text-center py-4">
                      <span className={`text-lg font-extrabold ${potential === 0 ? "text-red-500" : potential <= 3 ? "text-amber-500" : "text-emerald-500"}`}>
                        {potential}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
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
