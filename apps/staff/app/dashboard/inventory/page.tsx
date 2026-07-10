"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, PackagePlus, ChevronDown, X, Loader2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { getProducts, getInventory, getInventoryLogs, InventoryLogRecord } from "@/lib/api";
import { CustomSelect } from "@/components/custom-select";
import { Pagination } from "@/components/pagination";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const statusConfig: Record<StockStatus, { label: string; badge: string; dot: string }> = {
  in_stock: { label: "มีสินค้า", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  low_stock: { label: "สต็อกใกล้หมด", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  out_of_stock: { label: "สินค้าหมด", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
};

interface DisplayInventory {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentQty: number;
  reserved: number;
  status: StockStatus;
}

const filterTabs = ["สินค้าทั้งหมด", "กีตาร์", "แอมป์", "อุปกรณ์เสริม"];

function InventoryRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="pl-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-44" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto" /></TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto" /></TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell className="pr-6 text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-16 inline-block" /></TableCell>
    </TableRow>
  );
}

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("สินค้าทั้งหมด");
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState<DisplayInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DisplayInventory | null>(null);

  // Status Filter state
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, search, selectedStatus]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prodRes = await getProducts({ limit: 100 });
      const invRes = await getInventory();
      
      const invMap = new Map(invRes.inventories?.map((i) => [i.productId, i]) ?? []);
      const mapped: DisplayInventory[] = prodRes.products.map((p) => {
        const inv = invMap.get(p.productId);
        const currentQty = inv?.quantity ?? 0;
        const reserved = inv?.reservedQuantity ?? 0;
        const available = currentQty - reserved;
        const reorderPoint = inv?.reorderPoint ?? 0;
        
        let status: StockStatus = "in_stock";
        if (available === 0) {
          status = "out_of_stock";
        } else if (available <= reorderPoint || available <= 5) {
          status = "low_stock";
        }

        return {
          id: p.productId,
          sku: p.sku,
          name: p.name,
          category: p.category?.name ?? "ทั่วไป",
          currentQty,
          reserved,
          status,
        };
      });
      setInventory(mapped);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลคลังสินค้าได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = inventory.filter((item) => {
    const matchCat =
      activeCategory === "สินค้าทั้งหมด" ||
      (activeCategory === "กีตาร์" && item.category.toLowerCase().includes("guitar")) ||
      (activeCategory === "แอมป์" && item.category.toLowerCase().includes("amp")) ||
      (activeCategory === "อุปกรณ์เสริม" && !item.category.toLowerCase().includes("guitar") && !item.category.toLowerCase().includes("amp"));
      
    const matchSearch = search === "" ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus = selectedStatus === "all" || item.status === selectedStatus;

    return matchCat && matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedInventory = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">คลังสินค้า</h2>
          <p className="text-zinc-500 text-sm mt-1">ตรวจสอบและจัดการสต็อกคลังสินค้า</p>
        </div>
        <Link
          href="/dashboard/inventory/receive"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
        >
          <PackagePlus className="w-4 h-4" />
          รับสินค้าเข้าคลัง
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                showFilters
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-655 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              กรองข้อมูล
            </button>
            <span className="text-xs text-zinc-400 ml-auto">{filtered.length} รายการ</span>
          </div>

          {/* Collapsible Status Filter Dropdown */}
          {showFilters && (
            <div className="mb-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-200">
              <div className="max-w-xs">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5">สถานะสินค้า</label>
                <CustomSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: "all", label: "สถานะทั้งหมด" },
                    { value: "in_stock", label: "มีสินค้า" },
                    { value: "low_stock", label: "สต็อกใกล้หมด" },
                    { value: "out_of_stock", label: "สินค้าหมด" }
                  ]}
                  triggerClassName="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-250 dark:border-zinc-700 text-xs py-2 px-3 h-9"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>
            </div>
          )}

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
              <TableHead className="font-bold pl-6 text-xs uppercase tracking-wider">SKU</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">ชื่อสินค้า</TableHead>
              <TableHead className="font-bold text-center text-xs uppercase tracking-wider">คงคลังรวม</TableHead>
              <TableHead className="font-bold text-center text-xs uppercase tracking-wider">จอง</TableHead>
              <TableHead className="font-bold text-center text-xs uppercase tracking-wider">คงเหลือ</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">สถานะ</TableHead>
              <TableHead className="font-bold text-right pr-6 text-xs uppercase tracking-wider">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <InventoryRowSkeleton key={idx} />
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-red-500 font-semibold">{error}</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400">ไม่พบสินค้าที่ตรงกับเงื่อนไข</TableCell>
              </TableRow>
            ) : (
              paginatedInventory.map((item) => {
                const available = item.currentQty - item.reserved;
                const sc = statusConfig[item.status];
                return (
                  <TableRow key={item.sku} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="pl-6 text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.sku}</TableCell>
                    <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">{item.name}</TableCell>
                    <TableCell className="text-center font-bold text-zinc-900 dark:text-white">{item.currentQty}</TableCell>
                    <TableCell className="text-center text-zinc-500 dark:text-zinc-400 font-semibold">{item.reserved}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-sm ${available === 0 ? "text-red-500" : available <= 5 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {available}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-sm px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button
                        onClick={() => setSelectedHistoryItem(item)}
                        className="px-3 py-1.5 text-sm font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        ดูประวัติ
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalEntries={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {selectedHistoryItem && (
        <StockHistoryModal item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Stock History Timeline Modal Component
// ─────────────────────────────────────────────────────
interface StockHistoryModalProps {
  item: DisplayInventory;
  onClose: () => void;
}

function StockHistoryModal({ item, onClose }: StockHistoryModalProps) {
  const [logs, setLogs] = useState<InventoryLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await getInventoryLogs(item.id);
        setLogs(res.logs ?? []);
      } catch (err: any) {
        setError(err.message ?? "ไม่สามารถโหลดประวัติสต็อกได้");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [item.id]);

  const getActionDetails = (action: string) => {
    switch (action) {
      case "receive":
        return {
          label: "รับสินค้าเข้า",
          actionText: "ตรวจรับและเพิ่มเข้าคลังสินค้าสำเร็จ (Goods Received)",
          color: "text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-250 dark:border-emerald-900/50",
        };
      case "adjust":
        return {
          label: "ปรับยอดมือ",
          actionText: "ปรับปรุงยอดสต็อกสินค้าด้วยมือ (Manual Adjust)",
          color: "text-zinc-650 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-850",
        };
      case "reserve":
        return {
          label: "จองสินค้า",
          actionText: "ระบบจองสินค้าชั่วคราว (ชำระเงินออนไลน์เสร็จสิ้น)",
          color: "text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/40 border-amber-250 dark:border-amber-900/50",
        };
      case "release":
        return {
          label: "คืนสต็อก",
          actionText: "คืนสินค้าเข้าสต็อกเนื่องจากยกเลิก/ชำระเงินไม่สำเร็จ",
          color: "text-sky-600 dark:text-sky-450 bg-sky-50 dark:bg-sky-950/40 border-sky-250 dark:border-sky-900/50",
        };
      case "sale_deduct":
        return {
          label: "ตัดขายจริง",
          actionText: "ตัดสต็อกสินค้าจริงออกเนื่องจากจัดส่งสำเร็จ (Sale Deducted)",
          color: "text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/40 border-rose-250 dark:border-rose-900/50",
        };
      default:
        return {
          label: "การเคลื่อนไหว",
          actionText: "การเคลื่อนไหวคลังสินค้า",
          color: "text-zinc-600 dark:text-zinc-450 bg-zinc-50 dark:bg-zinc-800",
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold">ประวัติการเคลื่อนไหวสต็อก</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-semibold">
              สินค้า: {item.name} ({item.sku})
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Current Stock Snapshot */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <div className="text-center">
              <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider block">สต็อกในคลัง</span>
              <span className="text-xl font-extrabold text-zinc-850 dark:text-zinc-200">{item.currentQty}</span>
            </div>
            <div className="text-center border-l border-r border-zinc-200 dark:border-zinc-800">
              <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider block">จองจัดส่ง</span>
              <span className="text-xl font-extrabold text-amber-500">{item.reserved}</span>
            </div>
            <div className="text-center">
              <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider block">พร้อมใช้งาน</span>
              <span className="text-xl font-extrabold text-emerald-500">{Math.max(0, item.currentQty - item.reserved)}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">บันทึกกิจกรรมล่าสุด (Timeline Logs)</h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-zinc-450">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                กำลังโหลดบันทึกประวัติสต็อก...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 italic text-sm">
                ไม่มีประวัติการเคลื่อนไหวสต็อกสำหรับสินค้านี้
              </div>
            ) : (
              <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 pl-6 ml-3 space-y-6">
                {logs.map((log) => {
                  const details = getActionDetails(log.action);
                  const isPositive = ["receive", "release"].includes(log.action);
                  return (
                    <div key={log.id} className="relative">
                      {/* Circle dot on line */}
                      <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 shadow-sm ${
                        isPositive ? "border-emerald-500" : log.action === "reserve" ? "border-amber-500" : "border-rose-500"
                      }`} />
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-zinc-400 font-mono font-semibold">
                            {new Date(log.createdAt).toLocaleString("th-TH")}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${details.color}`}>
                            {details.label}
                          </span>
                          <span className={`ml-auto font-mono text-sm font-black ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                            {isPositive ? "+" : "-"}{Math.abs(log.changeQty)} ชิ้น
                          </span>
                        </div>
                        <p className="text-sm font-bold leading-snug">{details.actionText}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          {log.orderId && (
                            <span>ออเดอร์อ้างอิง: <strong className="font-mono text-zinc-600 dark:text-zinc-350">{log.orderId.slice(0, 8).toUpperCase()}</strong></span>
                          )}
                          {log.staffId && (
                            <span>ผู้ดำเนินการ: <strong className="text-zinc-650 dark:text-zinc-300">{log.staffId.slice(0, 8).toUpperCase()}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
