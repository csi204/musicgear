"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ScanLine, TrendingDown, TrendingUp, Clock, X, Check, Loader2, Printer } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { getOrders, getProducts, updateOrderStatus, OrderRecord } from "@/lib/api";

type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";

const statusConfig: Record<OrderStatus, { label: string; dot: string}> = {
  pending: { label: "รอดำเนินการ", dot: "bg-amber-500"},
  confirmed: { label: "ยืนยันแล้ว", dot: "bg-blue-500"},
  packed: { label: "แพ็คสินค้าแล้ว", dot: "bg-purple-500"},
  shipped: { label: "กำลังจัดส่ง", dot: "bg-sky-500"},
  delivered: { label: "ส่งสำเร็จแล้ว", dot: "bg-emerald-500"},
  cancelled: { label: "ยกเลิกแล้ว", dot: "bg-zinc-500"},
  refunded: { label: "คืนเงินแล้ว", dot: "bg-zinc-500"},
};

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "packed",
  packed: "shipped",
  shipped: "delivered",
};

const actionLabels: Record<OrderStatus, string> = {
  pending: "รับออเดอร์ (Confirm)",
  confirmed: "แพ็คสินค้าเสร็จ (Pack)",
  packed: "ส่งสินค้าแล้ว (Ship)",
  shipped: "ส่งสำเร็จ (Deliver)",
  delivered: "ออเดอร์เสร็จสมบูรณ์",
  cancelled: "ยกเลิกแล้ว",
  refunded: "คืนเงินแล้ว",
};

// ─────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 shadow-sm animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />
        <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-44 mt-2" />
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="pl-6 py-4"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell>
        <div className="space-y-1.5">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />
        </div>
      </TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" /></TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" /></TableCell>
      <TableCell className="pr-6 text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-16 inline-block" /></TableCell>
    </TableRow>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ordRes = await getOrders();
      const prodRes = await getProducts({ limit: 100 });
      
      const pMap = new Map<string, string>();
      prodRes.products?.forEach((p) => pMap.set(p.productId, p.name));
      
      setProductMap(pMap);
      setOrders(ordRes.orders ?? []);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลออเดอร์ได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransitionStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;
    
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, nextStatus);
      setSelectedOrder(null);
      await loadData();
    } catch (e: any) {
      alert(`ไม่สามารถปรับสถานะออเดอร์ได้: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRecipientName = (order: OrderRecord) => {
    const snap = order.shippingAddressSnapshot;
    if (!snap) return "ไม่ทราบชื่อ";
    if (snap.name) return snap.name;
    return `${snap.firstName ?? ""} ${snap.lastName ?? ""}`.trim() || "ไม่ทราบชื่อ";
  };

  const getAddressText = (order: OrderRecord) => {
    const snap = order.shippingAddressSnapshot;
    if (!snap) return "ไม่มีข้อมูลที่อยู่";
    return `${snap.streetAddress ?? snap.addressLine1 ?? ""}, ${snap.city ?? ""}, ${snap.state ?? ""}, ${snap.postalCode ?? ""}`.trim();
  };

  const filtered = orders.filter((o) => {
    const matchTab =
      activeTab === "all"
        ? ["pending", "confirmed", "packed", "shipped"].includes(o.status)
        : o.status === activeTab;
        
    const customer = getRecipientName(o).toLowerCase();
    const matchSearch =
      search === "" ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      customer.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // KPI Calculations
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const pickingCount = orders.filter((o) => ["confirmed", "packed"].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const kpis = [
    { label: "ออเดอร์รอการยืนยัน", value: pendingCount, sub: "ต้องได้รับการยืนยัน", icon: Clock },
    { label: "กำลังหยิบ/แพ็คสินค้า", value: pickingCount, sub: "กำลังเตรียมจัดส่ง", icon: ScanLine },
    { label: "ส่งสำเร็จทั้งหมด", value: deliveredCount, sub: "ส่งสำเร็จทั้งหมด", icon: Check },
  ];

  const tabs = [
    { key: "all", label: `เปิดดำเนินการอยู่ (${orders.filter((o) => ["pending", "confirmed", "packed", "shipped"].includes(o.status)).length})` },
    { key: "pending", label: `ค้างยืนยัน (${pendingCount})` },
    { key: "confirmed", label: `กำลังหยิบ/แพ็ค (${orders.filter((o) => o.status === "confirmed").length})` },
    { key: "packed", label: `แพ็คแล้ว (${orders.filter((o) => o.status === "packed").length})` },
    { key: "shipped", label: `กำลังจัดส่ง (${orders.filter((o) => o.status === "shipped").length})` },
    { key: "delivered", label: `ส่งแล้ว (${deliveredCount})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">จัดการออเดอร์</h2>
          <p className="text-zinc-500 text-sm mt-1">คิวงานจัดเตรียมและจัดส่งสินค้าของพนักงานคลังสินค้า</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
            {[1, 2, 3, 4].map((n) => <div key={n} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards - Upscaled for better proportion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 shadow-sm hover:shadow-md transition-all duration-300 min-h-[160px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-zinc-500 dark:text-[#ddc1b3] tracking-[0.7px]">{kpi.label}</span>
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-zinc-900 dark:text-[#e5e1e6] tracking-tight leading-none">{kpi.value}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{kpi.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters + Table */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-2">
            {/* Toolbar */}
            <div className="px-6 pt-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาออเดอร์ หรือชื่อลูกค้า..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                      activeTab === tab.key
                        ? "text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50/50 dark:bg-amber-500/5"
                        : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow>
                    <TableHead className="font-bold pl-6 text-xs uppercase tracking-wider text-zinc-500 h-12">รหัสออเดอร์</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">ลูกค้า</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">รายการสินค้า</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">สถานะ</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-zinc-500">วันที่สั่งซื้อ</TableHead>
                    <TableHead className="font-bold text-right pr-6 text-xs uppercase tracking-wider text-zinc-500">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-zinc-400">ไม่พบออเดอร์ในหมวดหมู่นี้</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((order) => {
                      const sc = statusConfig[order.status as OrderStatus] ?? statusConfig.pending;
                      const recipient = getRecipientName(order);
                      const address = getAddressText(order);
                      return (
                        <TableRow key={order.orderId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <TableCell className="font-bold text-zinc-900 dark:text-white pl-6 font-mono text-sm py-4">
                            {order.orderId.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{recipient}</div>
                            <div className="text-xs text-zinc-400 mt-1 max-w-[220px] truncate">{address}</div>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <div className="space-y-1">
                              {order.items?.map((item) => (
                                <div key={item.orderItemId} className="text-sm text-zinc-650 dark:text-zinc-400 truncate flex items-center gap-2">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">×{item.quantity}</span>
                                  {productMap.get(item.productId) ?? "Guitar Product"}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-sm px-3 py-1.5 font-bold border-none flex items-center gap-2 w-fit`}>
                              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                            {new Date(order.orderDate).toLocaleString("th-TH")}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2.5">
                              {(order.status === "packed" || order.status === "shipped") && (
                                <Link
                                  href={`/dashboard/orders/print?orderId=${order.orderId}`}
                                  className="px-4 py-2 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2 shadow-sm shrink-0"
                                >
                                  <Printer className="w-4 h-4" />
                                  Print Label
                                </Link>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setPickedItems({});
                                }}
                                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm shrink-0 uppercase tracking-wider"
                              >
                                จัดการคิว
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Fulfillment Modal Overlay - (No UI changes needed here as it looks fine, but included for completeness) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col gap-4 animate-in zoom-in duration-200 text-zinc-100 p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">รายละเอียดขั้นตอนการเตรียมจัดส่ง</h3>
              <p className="text-xs text-zinc-400 mt-1 font-mono">รหัสออเดอร์: {selectedOrder.orderId.toUpperCase()}</p>
            </div>

            <div className="border-t border-zinc-800 pt-3 space-y-2 text-sm text-zinc-300">
              <div>
                <span className="font-bold text-zinc-400">ผู้รับ:</span> {getRecipientName(selectedOrder)}
              </div>
              <div>
                <span className="font-bold text-zinc-400">ที่อยู่จัดส่ง:</span> {getAddressText(selectedOrder)}
              </div>
              {selectedOrder.remark && (
                <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-lg mt-2">
                  <span className="font-bold">หมายเหตุ:</span> {selectedOrder.remark}
                </div>
              )}
            </div>

            <div className="space-y-3 mt-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">รายการสินค้าที่ต้องหยิบ (Picking Checklist)</span>
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {selectedOrder.items?.map((item) => {
                  const pName = productMap.get(item.productId) ?? "Guitar Product";
                  const isPicked = !!pickedItems[item.orderItemId];
                  return (
                    <label
                      key={item.orderItemId}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isPicked
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                          : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isPicked}
                        onChange={() =>
                          setPickedItems((prev) => ({
                            ...prev,
                            [item.orderItemId]: !prev[item.orderItemId],
                          }))
                        }
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                      />
                      <div className="flex-1 text-sm leading-tight font-medium">
                        {pName}
                      </div>
                      <span className="text-sm font-extrabold bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-300 shrink-0">
                        ×{item.quantity}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Next Status button */}
            <div className="flex gap-3 pt-4 mt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-800 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
              >
                ปิดหน้าต่าง
              </button>
              {(selectedOrder.status === "packed" || selectedOrder.status === "shipped") && (
                <Link
                  href={`/dashboard/orders/print?orderId=${selectedOrder.orderId}`}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Label
                </Link>
              )}
              {nextStatusMap[selectedOrder.status as OrderStatus] && (
                <button
                  onClick={() => handleTransitionStatus(selectedOrder.orderId, selectedOrder.status as OrderStatus)}
                  disabled={
                    isUpdating ||
                    (selectedOrder.status === "confirmed" &&
                      selectedOrder.items?.some((i) => !pickedItems[i.orderItemId]))
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionLabels[selectedOrder.status as OrderStatus]}
                </button>
              )}
            </div>
            {selectedOrder.status === "confirmed" &&
              selectedOrder.items?.some((i) => !pickedItems[i.orderItemId]) && (
                <p className="text-[11px] text-zinc-500 text-center mt-1">
                  * กรุณาหยิบสินค้าให้ครบทุกชิ้นใน Checklist ก่อนดำเนินขั้นตอนแพ็คสินค้า
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  )
}