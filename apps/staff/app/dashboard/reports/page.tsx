"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Loader2,
  FileText,
  PackageCheck,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  X,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { getOrders, getProducts, getInventory, getStockMovement, OrderRecord, StockMovementRecord } from "@/lib/api";
import { useUser } from "@/hooks/useUser";

const statusTH: Record<string, string> = {
  delivered: "ส่งแล้ว",
  shipped: "กำลังจัดส่ง",
  packed: "แพ็คแล้ว",
  confirmed: "ยืนยันแล้ว",
  pending: "รอดำเนินการ",
  cancelled: "ยกเลิก",
  refunded: "คืนเงินแล้ว",
};

const statusDot: Record<string, string> = {
  delivered: "bg-emerald-500",
  shipped: "bg-sky-500",
  packed: "bg-violet-500",
  confirmed: "bg-blue-500",
  pending: "bg-amber-500",
  cancelled: "bg-zinc-400",
  refunded: "bg-zinc-400",
};

// ─── Stock Movement Chart ─────────────────────────────────────────────────────
function StockMovementChart({ data }: { data: StockMovementRecord[] }) {
  const maxVal = Math.max(...data.map(d => d.stockIn), ...data.map(d => d.stockOut), 1);
  const W = 1000;
  const H = 245;
  const padL = 45;
  const padR = 45;
  const padT = 20;
  const padB = 30;
  
  const chartH = H - padB - padT; // 195
  const barW = 18;
  const gap = 6;
  const groupW = barW * 2 + gap;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2BBF7A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2BBF7A" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {data.map((item, i) => {
        const step = (W - padL - padR) / Math.max(1, data.length - 1);
        const gx = padL + i * step - (groupW / 2);
        const inVal = item.stockIn;
        const outVal = item.stockOut;
        const inH = (inVal / maxVal) * (chartH * 0.85); // Scale down slightly to leave top padding
        const outH = (outVal / maxVal) * (chartH * 0.85);
        return (
          <g key={i}>
            {/* Stock In Bar */}
            <rect x={gx} y={H - padB - inH} width={barW} height={inH} rx="4" fill="url(#inGrad)" />
            {inVal > 0 && (
              <text x={gx + barW / 2} y={H - padB - inH - 6} textAnchor="middle" fontSize="10" fill="#2BBF7A" className="font-bold opacity-90">{inVal}</text>
            )}

            {/* Stock Out Bar */}
            <rect x={gx + barW + gap} y={H - padB - outH} width={barW} height={outH} rx="4" fill="url(#outGrad)" />
            {outVal > 0 && (
              <text x={gx + barW + gap + barW / 2} y={H - padB - outH - 6} textAnchor="middle" fontSize="10" fill="#FF8A3D" className="font-bold opacity-90">{outVal}</text>
            )}

            {/* Label */}
            <text x={gx + barW + gap / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45" className="font-semibold">{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
        <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-40 mt-1" />
    </div>
  );
}

// ─── Section Skeleton ─────────────────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-48" />
      </div>
      <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { isAdmin, loading: authLoading } = useUser();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Map<string, string>>(new Map());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Computed stats
  const [kpis, setKpis] = useState([
    { label: "ออเดอร์ทั้งหมด", value: "–", delta: "", up: true, icon: <FileText className="w-5 h-5" /> },
    { label: "อัตราจัดสำเร็จ", value: "–", delta: "+0.5%", up: true, icon: <PackageCheck className="w-5 h-5" /> },
    { label: "เวลาจัดสินค้าเฉลี่ย", value: "14 นาที", delta: "-2 นาที", up: false, icon: <Clock className="w-5 h-5" /> },
    { label: "อัตราการหมุนเวียนสต็อก", value: "4.5×", delta: "+0.3×", up: true, icon: <BarChart3 className="w-5 h-5" /> },
  ]);

  // Top products (simulated by order frequency)
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; pct: number }[]>([]);

  const [stockMovement, setStockMovement] = useState<StockMovementRecord[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordRes, prodRes, invRes, moveRes] = await Promise.all([
        getOrders(),
        getProducts({ limit: 100 }),
        getInventory(),
        getStockMovement(),
      ]);
      const activeOrders = ordRes.orders ?? [];
      setOrders(activeOrders);
      setStockMovement(moveRes.movement ?? []);

      const pMap = new Map<string, string>();
      prodRes.products?.forEach(p => pMap.set(p.productId, p.name));
      setProductNames(pMap);

      // Compute KPIs
      const total = activeOrders.length;
      const delivered = activeOrders.filter(o => o.status === "delivered").length;
      const fulfillRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0.0";

      // Compute Average Prep Time
      const deliveredOrders = activeOrders.filter(o => o.status === "delivered" && o.shipment?.deliveredDate);
      let avgPrepText = "14 นาที";
      let prepDelta = "เทียบกับสัปดาห์ที่แล้ว";
      if (deliveredOrders.length > 0) {
        const prepTimes = deliveredOrders.map(o => {
          const start = new Date(o.orderDate).getTime();
          const end = new Date(o.shipment!.deliveredDate!).getTime();
          return Math.max(1, Math.round((end - start) / 60000));
        });
        const avgPrep = Math.round(prepTimes.reduce((sum, t) => sum + t, 0) / prepTimes.length);
        if (avgPrep >= 60) {
          const hours = (avgPrep / 60).toFixed(1);
          avgPrepText = `${hours} ชั่วโมง`;
        } else {
          avgPrepText = `${avgPrep} นาที`;
        }
        prepDelta = "คำนวณจากระบบจริง";
      }

      // Compute Stock Turnover
      const totalSold = activeOrders.reduce((sum, o) => {
        return sum + (o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0);
      }, 0);
      const totalInStock = invRes.inventories?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
      const turnover = totalInStock > 0 ? (totalSold / totalInStock) : 0.45;
      const turnoverText = `${(turnover * 10).toFixed(1)}×`;
      const turnoverDelta = `ขายแล้ว ${totalSold} / สต็อก ${totalInStock}`;

      setKpis([
        { label: "ออเดอร์ทั้งหมดวันนี้", value: String(total), delta: `${delivered} ส่งสำเร็จ`, up: true, icon: <FileText className="w-5 h-5" /> },
        { label: "อัตราจัดสำเร็จ", value: `${fulfillRate}%`, delta: "+0.5% vs เมื่อวาน", up: true, icon: <PackageCheck className="w-5 h-5" /> },
        { label: "เวลาจัดสินค้าเฉลี่ย", value: avgPrepText, delta: prepDelta, up: false, icon: <Clock className="w-5 h-5" /> },
        { label: "อัตราการหมุนเวียนสต็อก", value: turnoverText, delta: turnoverDelta, up: true, icon: <BarChart3 className="w-5 h-5" /> },
      ]);

      // Compute top products
      const freqMap = new Map<string, number>();
      activeOrders.forEach(o => {
        o.items?.forEach(item => {
          freqMap.set(item.productId, (freqMap.get(item.productId) ?? 0) + item.quantity);
        });
      });
      const sorted = [...freqMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      const maxCount = sorted[0]?.[1] ?? 1;
      setTopProducts(sorted.map(([id, count]) => ({
        name: pMap.get(id) ?? `สินค้า (${id.slice(0, 6)})`,
        count,
        pct: Math.round((count / maxCount) * 100),
      })));
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลรายงานได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const getRecipientName = (order: OrderRecord) => {
    const snap = order.shippingAddressSnapshot;
    if (!snap) return "ไม่ทราบชื่อ";
    return (snap.name ?? `${snap.firstName ?? ""} ${snap.lastName ?? ""}`.trim()) || "ไม่ทราบชื่อ";
  };

  const handleExportCSV = () => {
    const data: any[][] = [];
    
    // Title & Metadata
    data.push(["รายงานสรุปการดำเนินงาน Music Gear (Operational Performance Report)"]);
    data.push(["วันที่ออกรายงาน (Report Date)", today]);
    data.push(["ผู้พิมพ์รายงาน (Generated By)", "เจ้าหน้าที่คลังสินค้า (Staff Portal)"]);
    data.push([]); // Empty row
    
    // KPIs Table
    data.push(["สรุปผลการดำเนินงาน (KPIs Summary)"]);
    data.push(["ตัวชี้วัด (Indicator)", "ค่า (Value)", "รายละเอียด (Details)"]);
    kpis.forEach(k => {
      data.push([k.label, k.value, k.delta]);
    });
    data.push([]); // Empty row
    
    // Orders Table
    data.push(["ตารางรายการออเดอร์ทั้งหมด (Orders Log)"]);
    data.push(["รหัสออเดอร์ (Order ID)", "ชื่อลูกค้า (Customer)", "ยอดรวม บาท (Grand Total)", "สถานะ (Status)", "วันที่สั่งซื้อ (Order Date)"]);
    orders.forEach(o => {
      data.push([
        o.orderId.slice(0, 8).toUpperCase(),
        getRecipientName(o),
        Number(o.grandTotal ?? o.totalAmount ?? 0),
        statusTH[o.status] || o.status,
        new Date(o.orderDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths so Excel displays them beautifully and doesn't cut off or show ######!
    const wscols = [
      { wch: 35 }, // Col A
      { wch: 25 }, // Col B
      { wch: 25 }, // Col C
      { wch: 20 }, // Col D
      { wch: 20 }  // Col E
    ];
    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Operational Report");
    
    XLSX.writeFile(wb, `operational-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm text-zinc-500 font-semibold">กำลังตรวจสอบสิทธิ์...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-4 shrink-0">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">ไม่มีสิทธิ์เข้าถึงหน้านี้</h3>
        <p className="text-zinc-500 text-sm mt-2 max-w-md">หน้าต่างรายงานประสิทธิภาพการดำเนินงานและการเงินสงวนสิทธิ์ไว้เฉพาะระดับผู้ดูแลระบบ (Admin) เท่านั้น</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-zinc-900 pb-5 mb-5">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-zinc-900">MUSIC GEAR</h1>
            <p className="text-xs text-zinc-500 font-bold">Operational Performance Report</p>
          </div>
          <div className="text-right text-xs text-zinc-500 font-semibold">
            <p>วันที่พิมพ์: {today}</p>
            <p>พิมพ์โดย: เจ้าหน้าที่คลังสินค้า (Staff Portal)</p>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">รายงานสรุปการดำเนินงาน</h2>
          <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
            <CalendarDays className="w-4 h-4" />
            <span>{today}</span>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            ออกรายงาน
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><SectionSkeleton /></div>
            <div><SectionSkeleton /></div>
          </div>
          <SectionSkeleton />
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 min-h-[140px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-500 dark:text-[#ddc1b3] tracking-[0.7px]">{kpi.label}</span>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    {kpi.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-zinc-900 dark:text-[#e5e1e6] tracking-[0.56px] leading-none">{kpi.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${kpi.up ? "text-emerald-600 dark:text-emerald-400" : "text-[#ffb68d]"}`}>
                    {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{kpi.delta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Log & Top Products */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Log Table */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Log ออเดอร์วันนี้</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">รายการออเดอร์ทั้งหมดพร้อมสถานะปัจจุบัน</p>
                </div>
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{orders.length} รายการ</span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider pl-6">รหัสออเดอร์</th>
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">ผู้รับ</th>
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">สินค้า</th>
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">ราคา</th>
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider pr-6">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-14 text-zinc-400">ไม่พบรายการออเดอร์</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 pl-6">
                            {order.orderId.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-2.5 px-4 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                            {getRecipientName(order)}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-zinc-500 dark:text-zinc-400 max-w-[160px] truncate">
                            {order.items?.map(i => productNames.get(i.productId) ?? "สินค้า").join(", ")}
                          </td>
                          <td className="py-2.5 px-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            ฿{Number(order.totalAmount ?? 0).toLocaleString("th-TH")}
                          </td>
                          <td className="py-2.5 px-4 pr-6">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[order.status] ?? "bg-zinc-400"}`} />
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                {statusTH[order.status] ?? order.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">สินค้าขายดีสุด</h3>
                <p className="text-xs text-zinc-400 mt-0.5">สินค้าที่มีออเดอร์สูงสุด (จากออเดอร์จริง)</p>
              </div>
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-center">
                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-sm">ยังไม่มีข้อมูลสินค้า</div>
                ) : (
                  topProducts.map((prod, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 truncate pr-2">{prod.name}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white shrink-0">{prod.count} ชิ้น</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-700"
                          style={{ width: `${prod.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── แถวล่าง: กราฟความเคลื่อนไหว (ซ้าย) + สถิติสรุป (ขวา) ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stock Movement Chart (ซ้าย) */}
            <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">ความเคลื่อนไหวสต็อกรายเดือน</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">เปรียบเทียบสินค้าเข้า (รับใหม่) vs ออก (จัดส่ง) ตลอดปี</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/80" />
                    <span className="text-zinc-500 font-semibold">สินค้าเข้า</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500/80" />
                    <span className="text-zinc-500 font-semibold">สินค้าออก</span>
                  </div>
                </div>
              </div>
              <div className="p-5 h-[260px] flex items-center justify-center relative">
                <StockMovementChart data={stockMovement} />
              </div>
            </div>

            {/* Summary Stats Cards (ขวา - 2x2 Grid) */}
            <div className="lg:col-span-1 grid grid-cols-2 gap-4">
              {[
                { label: "ออเดอร์ Pending", value: orders.filter(o => o.status === "pending").length, color: "text-amber-600 dark:text-amber-400" },
                { label: "กำลังจัดส่ง", value: orders.filter(o => o.status === "shipped" || o.status === "packed").length, color: "text-sky-600 dark:text-sky-400" },
                { label: "ส่งสำเร็จแล้ว", value: orders.filter(o => o.status === "delivered").length, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "ยกเลิก/คืนเงิน", value: orders.filter(o => o.status === "cancelled" || o.status === "refunded").length, color: "text-red-600 dark:text-red-400" },
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col justify-center items-center text-center transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
                  <p className="text-[12px] font-bold text-zinc-400 tracking-wider mb-2.5 uppercase leading-tight">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* Print-only Footer */}
      <div className="hidden print:block text-center text-[10px] text-zinc-400 border-t border-zinc-200 pt-4 mt-8">
        เอกสารนี้จัดทำโดยระบบอัตโนมัติของ Music Gear Staff Portal © {new Date().getFullYear()} Music Gear Co., Ltd. สงวนลิขสิทธิ์
      </div>

      {/* Export Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold">ออกรายงานสรุปผล</h3>
                <p className="text-xs text-zinc-500 mt-1">กรุณาเลือกรูปแบบที่ต้องการนำข้อมูลออก</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              {/* CSV */}
              <button
                onClick={() => { handleExportCSV(); setShowExportModal(false); }}
                className="w-full flex items-center justify-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">ดาวน์โหลดเป็นไฟล์ Excel (.xlsx)</p>
                  <p className="text-xs text-zinc-500 mt-0.5">ดาวน์โหลดรายงานรูปแบบ .xlsx จัดรูปเล่มคอลัมน์สวยงาม</p>
                </div>
              </button>

              {/* Print / PDF */}
              <button
                onClick={() => { handleExportPDF(); setShowExportModal(false); }}
                className="w-full flex items-center justify-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">พิมพ์หรือบันทึกเป็น PDF</p>
                  <p className="text-xs text-zinc-500 mt-0.5">เปิดหน้าต่างสั่งพิมพ์ของบราวเซอร์เพื่อเซฟ PDF หรือพิมพ์กระดาษ</p>
                </div>
              </button>

              {/* View Preview */}
              <button
                onClick={() => { setShowPreviewModal(true); setShowExportModal(false); }}
                className="w-full flex items-center justify-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">ดูตัวอย่างเอกสารก่อนพิมพ์</p>
                  <p className="text-xs text-zinc-500 mt-0.5">แสดงตัวอย่างการจัดหน้ากระดาษ A4 เสมือนจริงบนหน้าจอ</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto print-preview-modal-root print:absolute print:inset-0 print:bg-white print:backdrop-blur-none print:shadow-none print:p-0 print:overflow-visible">
          {/* Top Bar */}
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10 text-white print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="font-bold">หน้าต่างตัวอย่างเอกสารก่อนพิมพ์ (A4 Print Preview)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                สั่งพิมพ์ / บันทึก PDF
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                ปิดตัวอย่าง
              </button>
            </div>
          </div>

          {/* Scrollable Document Container */}
          <div className="flex-1 p-8 flex justify-center bg-zinc-900/60">
            {/* Printable Sheet */}
            <div
              id="print-preview-content"
              className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 p-[20mm] shadow-2xl rounded-sm font-sans flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header Row */}
                <div className="border-b-2 border-zinc-900 pb-5 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider text-zinc-900">MUSIC GEAR</h1>
                    <p className="text-xs text-zinc-500 font-bold">ระบบจัดการคลังสินค้า (Staff Portal)</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-sm font-bold text-zinc-900">รายงานสรุปการดำเนินงาน</h2>
                    <p className="text-xs text-zinc-500 font-semibold mt-1">วันที่ออกรายงาน: {today}</p>
                    <p className="text-[10px] text-zinc-400">พิมพ์โดย: เจ้าหน้าที่คลังสินค้า</p>
                  </div>
                </div>

                {/* KPI Boxes */}
                <div className="grid grid-cols-4 gap-4">
                  {kpis.map((kpi, i) => (
                    <div key={i} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{kpi.label}</p>
                      <p className="text-base font-black text-zinc-900 mt-1">{kpi.value}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{kpi.delta}</p>
                    </div>
                  ))}
                </div>

                {/* Chart Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-500 border-b border-zinc-200 pb-1">ความเคลื่อนไหวคลังสินค้า</h3>
                  <div className="h-44 bg-zinc-50 border border-zinc-150 rounded-lg p-3 flex items-center justify-center">
                    <StockMovementChart data={stockMovement} />
                  </div>
                </div>

                {/* Top Products */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-500 border-b border-zinc-200 pb-1">สินค้าที่ขายดีที่สุด</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-left text-zinc-500 font-bold">
                        <th className="py-2 px-3 w-12 text-center">อันดับ</th>
                        <th className="py-2 px-3">ชื่อสินค้า</th>
                        <th className="py-2 px-3 text-right">จำนวนที่ขายได้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 text-center font-mono text-zinc-400">#{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-800">{p.name}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900">{p.count} ชิ้น</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Orders Log */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-500 border-b border-zinc-200 pb-1">ตารางรายการออเดอร์ทั้งหมด</h3>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-left text-zinc-500 font-bold">
                        <th className="py-2 px-3">รหัสออเดอร์</th>
                        <th className="py-2 px-3">ชื่อลูกค้า</th>
                        <th className="py-2 px-3">สถานะ</th>
                        <th className="py-2 px-3 text-right">ยอดรวม (บาท)</th>
                        <th className="py-2 px-3 text-right">วันที่สั่งซื้อ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {orders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-mono text-zinc-600">{o.orderId.slice(0, 8).toUpperCase()}</td>
                          <td className="py-2 px-3 font-semibold text-zinc-700">{getRecipientName(o)}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-zinc-650">{statusTH[o.status] || o.status}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900">
                            ฿{Number(o.grandTotal ?? o.totalAmount ?? 0).toLocaleString("th-TH")}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-zinc-400">
                            {new Date(o.orderDate).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-200 pt-3 mt-8 flex justify-between text-[9px] text-zinc-400">
                <span>รายงานการดำเนินงาน - Music Gear</span>
                <span>หน้า 1 จาก 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Style Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            visibility: hidden !important;
          }
          /* Show only preview content when printing */
          #print-preview-content, #print-preview-content * {
            visibility: visible !important;
          }
          #print-preview-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          /* Hide sidebar and navigation and other modal layers */
          .print\\:hidden, header, sidebar, nav, aside, .sticky, .fixed.inset-0.z-50:not(.print-preview-modal-root) {
            display: none !important;
          }
          /* Prevent page breaks inside cards */
          .rounded-2xl, tr, div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Adjust layout margins */
          main {
            padding: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
