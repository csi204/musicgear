"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, Shield, TrendingUp, BarChart3, PieChart, Loader2, Warehouse, RefreshCw } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import Link from "next/link";
import { getOrders, getProducts, getInventory, OrderRecord } from "@/lib/api";

interface DisplayAlert {
  id: string;
  title: string;
  time: string;
  desc: string;
  priority: string;
  zone: string;
  borderColor: string;
  badgeColor: string;
  isCritical: boolean;
}

interface DonutItem {
  label: string;
  value: number;
  color: string;
}

// ─────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
        <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full mt-2" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-40 mt-1" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-44" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-60" />
      </div>
      <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Static data for Bar Chart (hourly fulfillment)
// ─────────────────────────────────────────────
const barData = [42, 58, 35, 71, 63, 88, 55, 76, 49, 92, 67, 84];
const barLabels = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const maxBar = Math.max(...barData);

// ─────────────────────────────────────────────
// Smooth Bézier helper
// ─────────────────────────────────────────────
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx1 = prev.x + (curr.x - prev.x) * 0.45;
    const cpy1 = prev.y;
    const cpx2 = curr.x - (curr.x - prev.x) * 0.45;
    const cpy2 = curr.y;
    d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

// ─────────────────────────────────────────────
// Smooth Line Chart Component
// ─────────────────────────────────────────────
const lineLabels = ["W1", "W2", "W3", "W4"];
const lMax = 100; const lMin = 94;

function InventoryLineChart({ points }: { points: number[] }) {
  const W = 500; const H = 180;
  const padL = 40; const padR = 24; const padT = 15; const padB = 28;
  const pts = points.map((v, i) => ({
    x: padL + (i / (points.length - 1)) * (W - padL - padR),
    y: padT + ((lMax - v) / (lMax - lMin)) * (H - padT - padB),
  }));
  const d = smoothPath(pts);
  const lastPt = pts[pts.length - 1]!;
  const firstPt = pts[0]!;
  const area = `${d} L ${lastPt.x.toFixed(1)} ${(H - padB).toFixed(1)} L ${firstPt.x.toFixed(1)} ${(H - padB).toFixed(1)} Z`;
  const lastVal = points[points.length - 1] ?? 99.6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {[96, 97, 98, 99, 100].map((v) => {
        const yy = padT + ((lMax - v) / (lMax - lMin)) * (H - padT - padB);
        return (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
            <text x={padL - 6} y={yy + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.4" className="font-semibold">{v}%</text>
          </g>
        );
      })}
      
      {/* 4 Weeks Label */}
      <text x={padL + ((W - padL - padR) * 0.1)} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45" className="font-medium">W1</text>
      <text x={padL + ((W - padL - padR) * 0.4)} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45" className="font-medium">W2</text>
      <text x={padL + ((W - padL - padR) * 0.7)} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45" className="font-medium">W3</text>
      <text x={W - padR - 10} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45" className="font-medium">W4</text>

      <path d={area} fill="url(#lineGrad)" />
      <path d={d} fill="none" stroke="#FF8A3D" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#FF8A3D" opacity="0.9" />
      ))}
      
      {/* Current % Badge */}
      <rect x={W - padR - 35} y={padT - 5} width="35" height="18" rx="4" fill="#FF8A3D" opacity="0.1" />
      <rect x={W - padR - 35} y={padT - 5} width="35" height="18" rx="4" fill="none" stroke="#FF8A3D" strokeOpacity="0.5" strokeWidth="1" />
      <text x={W - padR - 17.5} y={padT + 7} textAnchor="middle" fontSize="9" fill="#FF8A3D" fontWeight="bold">{lastVal.toFixed(1)}%</text>
    </svg>
  );
}

// Donut Ring Chart using stroke-dasharray
// ─────────────────────────────────────────────
function DonutRingChart({ items }: { items: DonutItem[] }) {
  const cx = 60; const cy = 60; const r = 44;
  const circumference = 2 * Math.PI * r;
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  // Start from top (-25% of circumference = -90deg)
  const startOffset = circumference * 0.25;

  return (
    // เปลี่ยนคลาสจาก w-32 h-32 เป็น w-44 h-44 เพื่อขยายขนาดกราฟโดนัท
    <svg viewBox="0 0 120 120" className="w-44 h-44 shrink-0 -rotate-90">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="14" />
      {items.map((item) => {
        const dash = (item.value / total) * circumference;
        const gap = circumference - dash;
        const thisOffset = circumference - (offset * circumference / total) + startOffset;
        offset += item.value;
        return (
          <circle
            key={item.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={item.color}
            strokeWidth="14"
            strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
            strokeDashoffset={thisOffset.toFixed(2)}
            strokeLinecap="butt"
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function StaffDashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [efficiency, setEfficiency] = useState("98.4%");
  const [warehouseCapacity, setWarehouseCapacity] = useState("–");
  const [capacityStatus, setCapacityStatus] = useState("กำลังโหลด...");

  const [alerts, setAlerts] = useState<DisplayAlert[]>([]);

  const [stockBreakdown, setStockBreakdown] = useState<DonutItem[]>([
    { label: "มีสินค้าพร้อมขาย", value: 0, color: "#2BBF7A" },
    { label: "สต็อกใกล้หมด", value: 0, color: "#FF8A3D" },
    { label: "สินค้าหมด", value: 0, color: "#E54848" },
  ]);

  const [barChartData, setBarChartData] = useState<number[]>([42, 58, 35, 71, 63, 88, 55, 76, 49, 92, 67, 84]);
  const [accuracyPoints, setAccuracyPoints] = useState<number[]>([96.1, 97.4, 95.8, 98.2, 97.0, 98.9, 99.1, 98.4, 97.7, 98.6, 99.3, 98.8]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ordRes = await getOrders({ limit: 100 });
      const prodRes = await getProducts({ limit: 100 });
      const invRes = await getInventory();

      const pMap = new Map<string, string>();
      prodRes.products?.forEach(p => pMap.set(p.productId, p.name));
      setProductMap(pMap);
      
      const activeOrders = ordRes.orders ?? [];
      setOrders(activeOrders);

      // Compute Delivery Efficiency
      const totalOrdersCount = activeOrders.length;
      const deliveredOrdersCount = activeOrders.filter(o => o.status === "delivered").length;
      const effPct = totalOrdersCount > 0 ? (deliveredOrdersCount / totalOrdersCount) * 100 : 98.4;
      setEfficiency(`${effPct.toFixed(1)}%`);

      // Compute Hourly Fulfillment Bar Chart
      const hourlyCounts = Array(12).fill(0);
      const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
      activeOrders.forEach(o => {
        const date = new Date(o.orderDate);
        const hourStr = String(date.getHours()).padStart(2, "0");
        const idx = hours.indexOf(hourStr);
        if (idx !== -1) {
          hourlyCounts[idx]++;
        }
      });
      const hasHourlyData = hourlyCounts.some(c => c > 0);
      if (hasHourlyData) {
        setBarChartData(hourlyCounts);
      } else {
        if (totalOrdersCount > 0) {
          const mockHourly = [2, 4, 3, 5, 4, 6, 5, 4, 3, 2, 1, 1].map(x => Math.round(x * (totalOrdersCount / 30)));
          setBarChartData(mockHourly);
        }
      }

      const inventories = invRes.inventories ?? [];
      if (inventories.length > 0) {
        const totalStock = inventories.length;

        const computed = inventories.map(i => {
          const avail = i.quantity - i.reservedQuantity;
          const status = avail <= 0 ? "Critical" : avail <= i.reorderPoint ? "Low" : "In Stock";
          return { ...i, computedStatus: status };
        });

        const ok = computed.filter(i => i.computedStatus === "In Stock").length;
        const low = computed.filter(i => i.computedStatus === "Low").length;
        const critical = computed.filter(i => i.computedStatus === "Critical").length;

        const okPct = Math.round((ok / totalStock) * 100);
        const lowPct = Math.round((low / totalStock) * 100);
        const critPct = 100 - okPct - lowPct;

        setStockBreakdown([
          { label: "มีสินค้าพร้อมขาย", value: okPct, color: "#2BBF7A" },
          { label: "สต็อกใกล้หมด", value: lowPct, color: "#FF8A3D" },
          { label: "สินค้าหมด", value: Math.max(0, critPct), color: "#E54848" },
        ]);

        // Compute Stock Accuracy based on Healthy Stock percentage
        const accuracyPct = Math.min(100, Math.max(94, 94 + (ok / totalStock) * 6));
        setAccuracyPoints([96.1, 97.4, 95.8, 98.2, 97.0, 98.9, 99.1, 98.4, 97.7, 98.6, 99.3, accuracyPct]);

        const occupied = inventories.filter(i => i.quantity > 0).length;
        const capacityPct = totalStock > 0 ? Math.round((occupied / totalStock) * 100) : 0;
        setWarehouseCapacity(`${capacityPct}%`);
        setCapacityStatus(capacityPct >= 90 ? "ใกล้เต็มคลัง" : capacityPct >= 60 ? "ใช้งานเหมาะสม" : "ยังว่างมาก");

        const lowItems = computed.filter(i => i.computedStatus === "Low" || i.computedStatus === "Critical").slice(0, 4);
        if (lowItems.length > 0) {
          setAlerts(lowItems.map((item, idx) => ({
            id: item.productId,
            title: item.computedStatus === "Critical" ? "สต็อกวิกฤต" : "สต็อกสินค้าต่ำ",
            time: `${idx * 15 + 5} นาทีที่แล้ว`,
            desc: `สินค้า '${pMap.get(item.productId) ?? "สินค้า"}' ต่ำกว่าเกณฑ์ความปลอดภัย (เหลือ: ${item.quantity} ชิ้น)`,
            priority: item.computedStatus === "Critical" ? "วิกฤต" : "เตือน",
            zone: idx % 2 === 0 ? "โซน A" : "โซน B",
            borderColor: item.computedStatus === "Critical" ? "border-l-red-500" : "border-l-amber-500",
            badgeColor: item.computedStatus === "Critical"
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
            isCritical: item.computedStatus === "Critical",
          })));
        } else {
          setAlerts([]);
        }
      }
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลสถิติหน้า Dashboard ได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getRecipientName = (order: OrderRecord) => {
    const snap = order.shippingAddressSnapshot;
    if (!snap) return "ไม่ทราบชื่อ";
    if (snap.name) return snap.name;
    return `${snap.firstName ?? ""} ${snap.lastName ?? ""}`.trim() || "ไม่ทราบชื่อ";
  };

  const metrics = [
    {
      title: "ประสิทธิภาพการจัดส่งสินค้า",
      value: efficiency,
      change: "+1.2%",
      status: "positive",
      desc: "เทียบกับสัปดาห์ที่แล้ว",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/20",
      icon: <TrendingUp className="w-6 h-6" />,
      progressBarWidth: "98.4%",
    },
    {
      title: "ความจุคลังสินค้า",
      value: warehouseCapacity,
      change: capacityStatus,
      status: capacityStatus === "ใกล้เต็มคลัง" ? "warning" : "positive",
      desc: "อัตราการใช้พื้นที่จัดเก็บ",
      bgGradient: "from-violet-500/10 to-purple-500/10",
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-500/20",
      icon: <Warehouse className="w-6 h-6" />,
      progressBarWidth: warehouseCapacity !== "–" ? warehouseCapacity : "0%",
    },
    {
      title: "รายการแจ้งเตือนคลังสินค้า",
      value: String(alerts.length),
      change: alerts.length > 0 ? "มีรายการสต็อกต่ำ" : "ปกติ",
      status: alerts.length > 0 ? "warning" : "positive",
      desc: alerts.length > 0 ? "มีสินค้าต่ำกว่าเกณฑ์" : "สต็อกทุกรายการปกติ",
      bgGradient: "from-red-500/10 to-orange-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-500/20",
      icon: <AlertTriangle className="w-6 h-6" />,
      progressBarWidth: alerts.length > 0 ? `${Math.min(100, alerts.length * 25)}%` : "0%",
    },
  ];

  const statusOrderColor: Record<string, string> = {
    delivered: "bg-emerald-500",
    shipped: "bg-sky-500",
    packed: "bg-violet-500",
    confirmed: "bg-blue-500",
    pending: "bg-amber-500",
    cancelled: "bg-zinc-400",
    refunded: "bg-zinc-400",
  };

  const statusOrderLabel: Record<string, string> = {
    delivered: "ส่งแล้ว",
    shipped: "กำลังจัดส่ง",
    packed: "แพ็คแล้ว",
    confirmed: "ยืนยันแล้ว",
    pending: "รอดำเนินการ",
    cancelled: "ยกเลิก",
    refunded: "คืนเงินแล้ว",
  };

  const getSystemStatus = () => {
    if (error) {
      return {
        label: "ขาดการติดต่อกับเซิร์ฟเวอร์",
        dotColor: "bg-red-500",
        badgeBg: "bg-red-50 dark:bg-red-500/10",
        borderColor: "border-red-200 dark:border-red-500/20",
        textColor: "text-red-700 dark:text-red-400",
      };
    }
    const hasCritical = alerts.some((a) => a.isCritical);
    if (hasCritical) {
      return {
        label: `พบคลังสินค้าวิกฤต (${alerts.filter(a => a.isCritical).length} รายการ)`,
        dotColor: "bg-red-500 animate-pulse",
        badgeBg: "bg-red-50 dark:bg-red-500/10",
        borderColor: "border-red-250 dark:border-red-500/25",
        textColor: "text-red-700 dark:text-red-400",
      };
    }
    if (alerts.length > 0) {
      return {
        label: `พบสต็อกต่ำกว่าเกณฑ์ (${alerts.length} รายการ)`,
        dotColor: "bg-amber-500 animate-pulse",
        badgeBg: "bg-amber-50 dark:bg-amber-500/10",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        textColor: "text-amber-700 dark:text-amber-400",
      };
    }
    return {
      label: "ระบบทำงานปกติ",
      dotColor: "bg-emerald-500 animate-pulse",
      badgeBg: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "border-emerald-200 dark:border-emerald-500/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
    };
  };

  const sysStatus = getSystemStatus();

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">ภาพรวมการดำเนินงาน</h2>
          <p className="text-zinc-500 mt-2 text-sm">LIVE TELEMETRY • ติดตามความเคลื่อนไหวภายในคลังสินค้า</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border font-semibold text-sm w-fit transition-all duration-300 ${sysStatus.badgeBg} ${sysStatus.borderColor} ${sysStatus.textColor}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${sysStatus.dotColor}`} />
            {sysStatus.label}
          </div>
          <button 
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/60 border border-zinc-250 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-250 transition-all disabled:opacity-50 shadow-sm"
            title="รีเฟรชข้อมูลคลัง"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><ChartSkeleton /></div>
            <div className="lg:col-span-1"><ChartSkeleton /></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1"><ChartSkeleton /></div>
            <div className="lg:col-span-2"><ChartSkeleton /></div>
          </div>
        </div>
      ) : (
        <>
          {/* แถวที่ 1: KPI Metrics */}
          <div className="grid gap-6 md:grid-cols-3">
            {metrics.map((metric, idx) => (
              <div key={idx} className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[148px]">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 flex flex-col justify-between h-full w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-500 dark:text-[#ddc1b3] tracking-[0.7px]">
                      {metric.title}
                    </span>
                    <div className={`w-11 h-11 rounded-xl ${metric.iconBg} flex items-center justify-center ${metric.iconColor} shrink-0`}>
                      {metric.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-zinc-900 dark:text-[#e5e1e6] tracking-[0.56px]">
                        {metric.value}
                      </span>
                      <span className="text-xs font-semibold text-[#ffb68d]">
                        {metric.change}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-[#353438] h-1 rounded-full overflow-hidden mt-3">
                      <div className="bg-[#ffb68d] h-full rounded-full" style={{ width: metric.progressBarWidth }} />
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                      {metric.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* แถวที่ 2: Bar Chart + Line Chart */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Bar Chart (Fulfillment) */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                    ออเดอร์ที่จัดส่งสำเร็จต่อชั่วโมง
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">ปริมาณออเดอร์ที่จัดการสำเร็จแต่ละชั่วโมง (วันนี้)</p>
                </div>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500"><div className="w-2 h-2 rounded-full bg-amber-500"></div> วันนี้</span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500"><div className="w-2 h-2 rounded-full bg-zinc-700"></div> เมื่อวาน</span>
                </div>
              </div>
              <div className="p-6 h-[280px] flex items-center justify-center">
                <svg viewBox={`0 0 ${barChartData.length * 44 + 24} 150`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  {barChartData.map((val, i) => {
                    const localMaxBar = Math.max(...barChartData, 1);
                    const barH = (val / localMaxBar) * 92;
                    const x = i * 44 + 12;
                    const barW = 28;
                    const isMax = val === localMaxBar;
                    return (
                      <g key={i}>
                        <rect x={x} y={10} width={barW} height={110} rx="5" fill="currentColor" opacity="0.03" />
                        <rect x={x} y={120 - barH} width={barW} height={barH} rx="5" fill="#FF8A3D" opacity={0.3 + (val / localMaxBar) * 0.7} />
                        <text x={x + barW / 2} y="142" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.45" className="font-semibold">{barLabels[i]}</text>
                        <text x={x + barW / 2} y={114 - barH} textAnchor="middle" fontSize="10" fill="currentColor" opacity={isMax ? "0.5" : "0.5"} fontWeight={isMax ? "700" : "600"}>{val}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Line Chart */}
            <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    ความแม่นยำสต็อก
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">แนวโน้มย้อนหลัง 4 สัปดาห์</p>
              </div>
              <div className="p-6 h-[280px] flex items-center justify-center relative">
                <InventoryLineChart points={accuracyPoints} />
              </div>
            </div>
          </div>

          {/* แถวที่ 3: Donut Chart + Alerts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Donut Chart */}
            <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between min-h-[340px]">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-500" />
                  สถานะสินค้าคงคลัง
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">สัดส่วนสถานะสินค้าในคลัง</p>
              </div>
              <div className="p-6 flex flex-col items-center justify-center flex-1">
                <div className="flex items-center gap-6 w-full justify-center">
                  <div className="relative">
                    <DonutRingChart items={stockBreakdown} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {/* ขยายตัวเลขเปอร์เซ็นต์ตรงกลางให้ใหญ่ขึ้นเป็น text-3xl */}
                      <span className="text-3xl font-black text-zinc-900 dark:text-white">
                        {stockBreakdown[0]?.value ?? 0}%
                      </span>
                      <span className="text-[11px] text-zinc-400 font-bold tracking-wider mt-1">มีสินค้า</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {stockBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center gap-3 text-sm">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-zinc-650 dark:text-zinc-300 font-semibold">{item.label}</span>
                        <span className="ml-auto font-bold text-zinc-800 dark:text-zinc-100 pl-3 text-base">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[340px]">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  การแจ้งเตือนล่าสุด
                </h3>
                <Link href="/dashboard/inventory" className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/60 transition-colors uppercase tracking-wide">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto h-full flex-1">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-6 border-l-4 ${alert.borderColor} hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${alert.isCritical ? "bg-red-500" : "bg-amber-500"}`}></span>
                        <h4 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">{alert.title}</h4>
                      </div>
                      <span className="text-sm text-zinc-500 font-medium whitespace-nowrap pt-0.5">
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-[15px] text-zinc-400 mt-2.5 ml-6 leading-relaxed">{alert.desc}</p>
                    <div className="flex gap-2.5 mt-4 ml-6">
                      <Badge variant="outline" className={`text-[11px] px-2.5 py-1 font-bold border-none uppercase tracking-wide ${alert.badgeColor}`}>
                        {alert.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] px-2.5 py-1 font-bold bg-zinc-800 text-zinc-300 border-none uppercase tracking-wide">
                        {alert.zone}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {/* เพิ่มข้อความ fallback กรณีที่การแจ้งเตือนมีแค่ 1 อัน เพื่อไม่ให้ขอบล่างดูโล่งเกินไป */}
                {alerts.length < 2 && (
                  <div className="p-6 flex items-center justify-center text-sm text-zinc-500 italic opacity-60 h-32">
                    ไม่มีการแจ้งเตือนเพิ่มเติม
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* แถวที่ 4: Recent Orders (Full Width) */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">ออเดอร์ล่าสุด</h3>
              </div>
              <Link href="/dashboard/orders" className="px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/60 transition-colors">
                VIEW ALL
              </Link>
            </div>
            <div className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider pl-6 text-zinc-500 h-12">ORDER ID</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-zinc-500">CUSTOMER NAME</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-zinc-500">ITEMS</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-zinc-500">STATUS</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right pr-6 text-zinc-500">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-zinc-400 text-sm">ไม่มีออเดอร์คงค้างในขณะนี้</TableCell>
                    </TableRow>
                  ) : (
                    orders.slice(0, 5).map((order) => {
                      const recipient = getRecipientName(order);
                      const dotColor = statusOrderColor[order.status] ?? "bg-zinc-400";
                      const statusLabel = statusOrderLabel[order.status] ?? order.status;
                      return (
                        <TableRow key={order.orderId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <TableCell className="font-bold text-zinc-300 text-[12px] pl-6 py-4">
                            {order.orderId.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="font-medium text-sm text-white">{recipient}</TableCell>
                          <TableCell className="text-zinc-400 text-sm truncate max-w-[250px]">
                            {order.items?.map(i => `${productMap.get(i.productId) ?? "สินค้า"} (×${i.quantity})`).join(", ")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              <span className={`text-sm font-bold uppercase ${dotColor.replace("bg-", "text-")}`}>{statusLabel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Link href="/dashboard/orders" className="px-4 py-2 text-sm font-bold rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 transition-colors inline-block tracking-wider uppercase">
                              {order.status === 'pending' ? 'ตรวจสอบสินค้า' : order.status === 'confirmed' ? 'แพ็คสินค้า' : order.status === 'packed' ? 'ส่งสินค้า' : 'VIEW'}
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
        </>
      )}
    </div>
  );
}