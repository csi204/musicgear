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
} from "lucide-react";
import { getOrders, getProducts, OrderRecord } from "@/lib/api";

// ─── Static data for charts (mock enrichment) ────────────────────────────────
const stockInData = [12, 30, 8, 25, 0, 18, 42, 5, 33, 20, 15, 28];
const stockOutData = [19, 22, 11, 38, 4, 29, 35, 12, 28, 16, 22, 31];
const movementLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

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
function StockMovementChart() {
  const maxVal = Math.max(...stockInData, ...stockOutData) || 1;
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
      {movementLabels.map((label, i) => {
        const step = (W - padL - padR) / 11;
        const gx = padL + i * step - (groupW / 2);
        const inVal = stockInData[i]!;
        const outVal = stockOutData[i]!;
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
            <text x={gx + barW + gap / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45" className="font-semibold">{label}</text>
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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Map<string, string>>(new Map());

  // Computed stats
  const [kpis, setKpis] = useState([
    { label: "ออเดอร์ทั้งหมด", value: "–", delta: "", up: true, icon: <FileText className="w-5 h-5" /> },
    { label: "อัตราจัดสำเร็จ", value: "–", delta: "+0.5%", up: true, icon: <PackageCheck className="w-5 h-5" /> },
    { label: "เวลาจัดสินค้าเฉลี่ย", value: "14 นาที", delta: "-2 นาที", up: false, icon: <Clock className="w-5 h-5" /> },
    { label: "อัตราการหมุนเวียนสต็อก", value: "4.5×", delta: "+0.3×", up: true, icon: <BarChart3 className="w-5 h-5" /> },
  ]);

  // Top products (simulated by order frequency)
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; pct: number }[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordRes, prodRes] = await Promise.all([getOrders(), getProducts({ limit: 100 })]);
      const activeOrders = ordRes.orders ?? [];
      setOrders(activeOrders);

      const pMap = new Map<string, string>();
      prodRes.products?.forEach(p => pMap.set(p.productId, p.name));
      setProductNames(pMap);

      // Compute KPIs
      const total = activeOrders.length;
      const delivered = activeOrders.filter(o => o.status === "delivered").length;
      const fulfillRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0.0";

      setKpis([
        { label: "ออเดอร์ทั้งหมดวันนี้", value: String(total), delta: `${delivered} ส่งสำเร็จ`, up: true, icon: <FileText className="w-5 h-5" /> },
        { label: "อัตราจัดสำเร็จ", value: `${fulfillRate}%`, delta: "+0.5% vs เมื่อวาน", up: true, icon: <PackageCheck className="w-5 h-5" /> },
        { label: "เวลาจัดสินค้าเฉลี่ย", value: "14 นาที", delta: "-2 นาที vs เมื่อวาน", up: false, icon: <Clock className="w-5 h-5" /> },
        { label: "อัตราการหมุนเวียนสต็อก", value: "4.5×", delta: "+0.3× vs เดือนที่แล้ว", up: true, icon: <BarChart3 className="w-5 h-5" /> },
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">รายงานสรุปการดำเนินงาน</h2>
          <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
            <CalendarDays className="w-4 h-4" />
            <span>{today}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20">
            <Download className="w-4 h-4" />
            Export PDF
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
                            ฿{(order.totalAmount ?? 0).toLocaleString("th-TH")}
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
                <StockMovementChart />
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
                  <p className="text-[10px] font-bold text-zinc-400 tracking-wider mb-2.5 uppercase leading-tight">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
