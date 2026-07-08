"use client";

import { Download, TrendingUp, TrendingDown } from "lucide-react";

// Mock data — bar chart: orders fulfilled per hour
const fulfillmentData = [42, 58, 35, 71, 63, 88, 55, 76, 49, 92, 67, 84];
const fulfillmentLabels = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const maxFulfill = Math.max(...fulfillmentData);

// Mock data — line chart: inventory accuracy over 6 months
const accuracyPoints = [96.1, 97.4, 95.8, 98.2, 97.0, 98.9, 99.1, 98.4, 97.7, 98.6, 99.3, 98.8];
const accuracyLabels = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const accMax = 100; const accMin = 94;

// Mock data — horizontal bar: stock turn rate by category
const stockTurnData = [
  { label: "Electric Guitars", value: 4.2, max: 6 },
  { label: "Acoustic Guitars", value: 5.8, max: 6 },
  { label: "Amplifiers", value: 3.1, max: 6 },
  { label: "Microphones", value: 6.0, max: 6 },
  { label: "Accessories", value: 4.7, max: 6 },
  { label: "Studio Monitors", value: 2.5, max: 6 },
];

// Mock data — donut: order status distribution
const orderDistrib = [
  { label: "Delivered", value: 62, color: "#22C55E" },
  { label: "In Transit", value: 21, color: "#3B82F6" },
  { label: "Packing", value: 11, color: "#A855F7" },
  { label: "Pending", value: 6, color: "#F97316" },
];

const kpiCards = [
  { label: "Orders Fulfilled Today", value: "641", delta: "+8.3%", up: true },
  { label: "Inventory Accuracy", value: "98.8%", delta: "+0.5%", up: true },
  { label: "Avg Fulfillment Time", value: "14m", delta: "-2m", up: false },
  { label: "Stock Turn Rate", value: "4.5×", delta: "+0.3×", up: true },
];

function InventoryAccuracyChart() {
  const w = 560; const h = 140;
  const pL = 40; const pR = 12; const pT = 12; const pB = 28;
  const cx = (i: number) => pL + (i / (accuracyPoints.length - 1)) * (w - pL - pR);
  const cy = (v: number) => pT + ((accMax - v) / (accMax - accMin)) * (h - pT - pB);
  const d = accuracyPoints.map((v, i) => `${i === 0 ? "M" : "L"} ${cx(i).toFixed(1)} ${cy(v).toFixed(1)}`).join(" ");
  const area = `${d} L ${cx(accuracyPoints.length - 1).toFixed(1)} ${(h - pB).toFixed(1)} L ${cx(0).toFixed(1)} ${(h - pB).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[95, 97, 99].map((v) => (
        <g key={v}>
          <line x1={pL} x2={w - pR} y1={cy(v)} y2={cy(v)} stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
          <text x={pL - 4} y={cy(v) + 4} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.35">{v}%</text>
        </g>
      ))}
      {accuracyPoints.map((_, i) => i % 2 === 0 && (
        <text key={i} x={cx(i)} y={h - 4} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.35">{accuracyLabels[i]}</text>
      ))}
      <path d={area} fill="url(#accGrad)" />
      <path d={d} fill="none" stroke="#F97316" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {accuracyPoints.map((v, i) => (
        <circle key={i} cx={cx(i)} cy={cy(v)} r="3" fill="#F97316" opacity="0.8" />
      ))}
    </svg>
  );
}

function OrdersBarChart() {
  return (
    <svg viewBox={`0 0 ${fulfillmentData.length * 48 + 20} 140`} className="w-full h-full" preserveAspectRatio="none">
      {fulfillmentData.map((val, i) => {
        const barH = (val / maxFulfill) * 110;
        const x = i * 48 + 10; const barW = 34;
        const opacity = 0.25 + (val / maxFulfill) * 0.75;
        return (
          <g key={i}>
            <rect x={x} y={120 - barH} width={barW} height={barH} rx="4" fill="#F97316" opacity={opacity} />
            <text x={x + barW / 2} y="135" textAnchor="middle" fontSize="7.5" fill="currentColor" opacity="0.35">{fulfillmentLabels[i]}</text>
            <text x={x + barW / 2} y={113 - barH} textAnchor="middle" fontSize="8" fill="currentColor" opacity={val === maxFulfill ? "0.95" : "0.5"} fontWeight={val === maxFulfill ? "700" : "400"}>{val}</text>
          </g>
        );
      })}
    </svg>
  );
}

function OrderDistribDonut() {
  const total = orderDistrib.reduce((s, x) => s + x.value, 0);
  const r = 50; const ocx = 64; const ocy = 64;
  let startAngle = -90;
  const arcs = orderDistrib.map((item) => {
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
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 128 128" className="w-28 h-28 shrink-0">
        {arcs.map((a) => <path key={a.label} d={a.path} fill={a.color} opacity="0.9" />)}
        <circle cx={ocx} cy={ocy} r={32} fill="white" className="dark:fill-zinc-900" />
        <text x={ocx} y={ocy - 3} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1f2937" className="dark:fill-zinc-100">641</text>
        <text x={ocx} y={ocy + 12} textAnchor="middle" fontSize="7.5" fill="#9ca3af">orders</text>
      </svg>
      <div className="space-y-2 w-full">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-zinc-500 dark:text-zinc-400 flex-1">{a.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${a.value}%`, backgroundColor: a.color }} />
            </div>
            <span className="font-bold text-zinc-700 dark:text-zinc-300 w-8 text-right">{a.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Performance Reports</h2>
          <p className="text-zinc-500 text-sm mt-1">รายงานผลการดำเนินงานคลังสินค้า — ข้อมูล ณ วันนี้</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-colors">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 tracking-widest mb-3">{kpi.label}</p>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{kpi.value}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${kpi.up ? "text-emerald-500" : "text-emerald-500"}`}>
              {kpi.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {kpi.delta}
              <span className="text-zinc-400 font-normal text-xs ml-1">vs yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Bar Chart + Donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Orders Fulfilled per Hour</h3>
              <p className="text-xs text-zinc-400 mt-0.5">จำนวนออเดอร์ที่จัดส่งสำเร็จต่อชั่วโมง (วันนี้)</p>
            </div>
            <span className="text-2xl font-extrabold text-amber-500">641</span>
          </div>
          <div className="p-6 h-36">
            <OrdersBarChart />
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Order Status Distribution</h3>
            <p className="text-xs text-zinc-400 mt-0.5">สัดส่วนสถานะออเดอร์ทั้งหมดวันนี้</p>
          </div>
          <div className="p-6">
            <OrderDistribDonut />
          </div>
        </div>
      </div>

      {/* Row 2: Line Chart */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Inventory Accuracy over Time</h3>
            <p className="text-xs text-zinc-400 mt-0.5">ความแม่นยำสต็อก 12 เดือนล่าสุด (%)</p>
          </div>
          <span className="text-2xl font-extrabold text-amber-500">98.8%</span>
        </div>
        <div className="p-6 h-40">
          <InventoryAccuracyChart />
        </div>
      </div>

      {/* Row 3: Stock Turn Rate Horizontal Bars */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Stock Turn Rate by Category</h3>
          <p className="text-xs text-zinc-400 mt-0.5">อัตราการหมุนเวียนสต็อกต่อหมวดสินค้า (ครั้ง/ปี)</p>
        </div>
        <div className="p-6 space-y-4">
          {stockTurnData.map((item) => {
            const pct = (item.value / item.max) * 100;
            const isHigh = item.value >= 5;
            return (
              <div key={item.label} className="flex items-center gap-4">
                <span className="text-sm text-zinc-600 dark:text-zinc-400 w-40 shrink-0">{item.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isHigh ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-10 text-right ${isHigh ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {item.value}×
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
