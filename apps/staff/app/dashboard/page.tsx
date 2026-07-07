"use client";

import { AlertTriangle, Clock, Package, Shield, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import Link from "next/link";

const metrics = [
  {
    title: "Fulfillment Efficiency",
    value: "98.4%",
    change: "+1.2%",
    status: "positive",
    desc: "ประสิทธิภาพการจัดสินค้าสำเร็จ",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-500/20",
  },
  {
    title: "Warehouse Capacity",
    value: "82.0%",
    change: "Optimal",
    status: "neutral",
    desc: "ความจุของคลังสินค้าปัจจุบัน",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/20",
  },
  {
    title: "Safety Incidents",
    value: "0",
    change: "Last 30 Days",
    status: "positive",
    desc: "จำนวนอุบัติเหตุในคลังสินค้า",
    bgGradient: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-500/20",
  },
];

const alerts = [
  {
    id: 1,
    title: "Picking Error Detected",
    time: "10 mins ago",
    desc: "Mismatch in Zone C, Rack 4. Expected: XLR-10M (x5). Scanned: XLR-5M.",
    priority: "HIGH PRIORITY",
    zone: "ZONE C",
    bg: "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: 2,
    title: "Low Stock Warning",
    time: "45 mins ago",
    desc: "Item 'Audio Interface MkII' dropping below safety threshold (Current: 12).",
    priority: "WARNING",
    zone: "ZONE A",
    bg: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
    badgeColor: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  },
  {
    id: 3,
    title: "Stock Discrepancy",
    time: "2 hrs ago",
    desc: "Cycle count mismatch in Zone A. System: 45. Physical: 42. Adjustment pending approval.",
    priority: "HIGH PRIORITY",
    zone: "ZONE A",
    bg: "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: 4,
    title: "Shipment Delayed",
    time: "4 hrs ago",
    desc: "Outbound carrier for Route 7 delayed by 2 hours. Dock bay 3 reassigned.",
    priority: "INFO",
    zone: "DOCK 3",
    bg: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
];

const recentOrders = [
  { id: "MG-1024", customer: "Sarah Jenkins", items: "2 items (Acoustic Guitar, Stand)", status: "Pending", action: "REVIEW" },
  { id: "MG-1023", customer: "David Miller", items: "1 item (MIDI Keyboard)", status: "Confirmed", action: "PACK" },
  { id: "MG-1022", customer: "Elena Rodriguez", items: "5 items (Drum Sticks, Practice Pad...)", status: "Packing", action: "SHIPPED" },
  { id: "MG-1021", customer: "Michael Chang", items: "1 item (Bass Amplifier)", status: "Delivered", action: "VIEW" },
  { id: "MG-1020", customer: "Lisa Thomson", items: "3 items (XLR Cables, Mic Stand)", status: "Shipping", action: "VIEW" },
];

const barData = [42, 58, 35, 71, 63, 88, 55, 76, 49, 92, 67, 84];
const barLabels = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const maxBar = Math.max(...barData);

const linePoints = [96.1, 97.4, 95.8, 98.2, 97.0, 98.9, 99.1, 98.4, 97.7, 98.6, 99.3, 98.8];
const lineMax = 100;
const lineMin = 94;

function InventoryLineChart() {
  const w = 540; const h = 130;
  const padL = 36; const padR = 10; const padT = 10; const padB = 24;
  const cx = (i: number) => padL + (i / (linePoints.length - 1)) * (w - padL - padR);
  const cy = (v: number) => padT + ((lineMax - v) / (lineMax - lineMin)) * (h - padT - padB);
  const d = linePoints.map((v, i) => `${i === 0 ? "M" : "L"} ${cx(i).toFixed(1)} ${cy(v).toFixed(1)}`).join(" ");
  const area = `${d} L ${cx(linePoints.length - 1).toFixed(1)} ${(h - padB).toFixed(1)} L ${cx(0).toFixed(1)} ${(h - padB).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[96, 97, 98, 99, 100].map((v) => (
        <g key={v}>
          <line x1={padL} x2={w - padR} y1={cy(v)} y2={cy(v)} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
          <text x={padL - 4} y={cy(v) + 4} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.4">{v}%</text>
        </g>
      ))}
      <path d={area} fill="url(#lineGrad)" />
      <path d={d} fill="none" stroke="#F97316" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {linePoints.map((v, i) => (
        <circle key={i} cx={cx(i)} cy={cy(v)} r="3" fill="#F97316" opacity="0.8" />
      ))}
    </svg>
  );
}

function StockDonutChart() {
  const items = [
    { label: "In Stock", value: 67, color: "#22C55E" },
    { label: "Low Stock", value: 21, color: "#F97316" },
    { label: "Out of Stock", value: 12, color: "#EF4444" },
  ];
  const total = items.reduce((s, x) => s + x.value, 0);
  const r = 52; const ocx = 64; const ocy = 64;
  let startAngle = -90;
  const arcs = items.map((item) => {
    const angle = (item.value / total) * 360;
    const s = (startAngle * Math.PI) / 180;
    const e = ((startAngle + angle) * Math.PI) / 180;
    const x1 = ocx + r * Math.cos(s); const y1 = ocy + r * Math.sin(s);
    const x2 = ocx + r * Math.cos(e); const y2 = ocy + r * Math.sin(e);
    const large = angle > 180 ? 1 : 0;
    const path = `M ${ocx} ${ocy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
    startAngle += angle;
    return { ...item, path };
  });
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 128 128" className="w-32 h-32 shrink-0">
        {arcs.map((a) => <path key={a.label} d={a.path} fill={a.color} opacity="0.9" />)}
        <circle cx={ocx} cy={ocy} r={34} fill="white" className="dark:fill-zinc-900" />
        <text x={ocx} y={ocy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937" className="dark:fill-zinc-100">{total}</text>
        <text x={ocx} y={ocy + 12} textAnchor="middle" fontSize="8" fill="#9ca3af">SKUs</text>
      </svg>
      <div className="space-y-2.5">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">{a.label}</span>
            <span className="ml-auto font-bold text-zinc-800 dark:text-zinc-100">{a.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffDashboardPage() {
  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Operations Overview</h2>
          <p className="text-zinc-500 mt-2">LIVE TELEMETRY • ติดตามความเคลื่อนไหวภายในคลังสินค้า</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm w-fit">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          System Nominal
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex flex-row items-center justify-between pb-4 relative z-10">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{metric.title}</h3>
              <div className={`w-10 h-10 rounded-full ${metric.iconBg} flex items-center justify-center ${metric.iconColor}`}>
                {idx === 0 && <TrendingUp className="w-5 h-5" />}
                {idx === 1 && <Package className="w-5 h-5" />}
                {idx === 2 && <Shield className="w-5 h-5" />}
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{metric.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-bold ${metric.status === "positive" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>{metric.change}</span>
                <span className="text-xs text-zinc-400">{metric.desc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Orders Fulfilled per Hour
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">ปริมาณออเดอร์ที่จัดการสำเร็จแต่ละชั่วโมง (วันนี้)</p>
          </div>
          <div className="p-6">
            <svg viewBox={`0 0 ${barData.length * 48 + 20} 140`} className="w-full h-32" preserveAspectRatio="none">
              {barData.map((val, i) => {
                const barH = (val / maxBar) * 110;
                const x = i * 48 + 10;
                const barW = 34;
                const opacity = 0.3 + (val / maxBar) * 0.7;
                return (
                  <g key={i}>
                    <rect x={x} y={120 - barH} width={barW} height={barH} rx="4" fill="#F97316" opacity={opacity} />
                    <text x={x + barW / 2} y="135" textAnchor="middle" fontSize="7.5" fill="currentColor" opacity="0.4">{barLabels[i]}</text>
                    <text x={x + barW / 2} y={114 - barH} textAnchor="middle" fontSize="8" fill="currentColor" opacity={val === maxBar ? "0.9" : "0.5"} fontWeight={val === maxBar ? "700" : "400"}>{val}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Stock Status Breakdown
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">สัดส่วนสถานะสินค้าในคลัง</p>
          </div>
          <div className="p-6 flex items-center justify-center">
            <StockDonutChart />
          </div>
        </div>
      </div>

      {/* Inventory Accuracy Line Chart */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Inventory Accuracy over Time</h3>
            <p className="text-xs text-zinc-400 mt-0.5">ความแม่นยำสต็อก 12 เดือนล่าสุด</p>
          </div>
          <span className="text-2xl font-extrabold text-amber-500">98.8%</span>
        </div>
        <div className="p-6 h-36">
          <InventoryLineChart />
        </div>
      </div>

      {/* Alerts & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Recent Alerts
            </h3>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 cursor-pointer hover:underline">View All</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto max-h-[500px] flex-1">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-5 border-l-4 ${alert.id % 2 === 1 ? "border-l-amber-500" : "border-l-transparent"} ${alert.bg} transition-colors`}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{alert.title}</h4>
                  <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3" />{alert.time}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{alert.desc}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-bold ${alert.badgeColor} border-none`}>{alert.priority}</Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-none">{alert.zone}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Orders</h3>
              <p className="text-xs text-zinc-400 mt-1">ออเดอร์ล่าสุดที่ต้องดำเนินการจัดเตรียมสินค้า</p>
            </div>
            <Link href="/dashboard/orders" className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/60 transition-colors">
              VIEW ALL
            </Link>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">ORDER ID</TableHead>
                  <TableHead className="font-bold">CUSTOMER</TableHead>
                  <TableHead className="font-bold">ITEMS</TableHead>
                  <TableHead className="font-bold">STATUS</TableHead>
                  <TableHead className="font-bold text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="font-bold text-zinc-900 dark:text-white">{order.id}</TableCell>
                    <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">{order.customer}</TableCell>
                    <TableCell className="text-zinc-500 text-xs">{order.items}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${order.status === "Delivered" ? "bg-emerald-500" : order.status === "Pending" ? "bg-amber-500" : "bg-blue-500"}`} />
                        <span className="text-xs font-semibold">{order.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm">
                        {order.action}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
