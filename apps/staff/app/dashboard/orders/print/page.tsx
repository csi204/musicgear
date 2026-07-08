"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Loader2,
  Check,
  ChevronUp,
  ChevronDown,
  Package,
  Barcode,
  Settings2,
} from "lucide-react";
import { getOrders, OrderRecord } from "@/lib/api";

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function BarcodeDisplay({ value }: { value: string }) {
  // Simple visual barcode using thin/thick vertical bars
  const bars = value
    .split("")
    .flatMap((c) => {
      const code = c.charCodeAt(0);
      return [code % 3 === 0, code % 5 !== 1, code % 2 === 0, true, false];
    })
    .slice(0, 80);

  return (
    <div className="flex items-end gap-px h-10">
      {bars.map((thick, i) => (
        <div
          key={i}
          className={`bg-zinc-900 ${thick ? "w-1" : "w-0.5"}`}
          style={{ height: thick ? "100%" : "70%" }}
        />
      ))}
    </div>
  );
}

function ShippingLabelPreview({
  order,
  carrier,
}: {
  order: OrderRecord;
  carrier: string;
}) {
  const snap = order.shippingAddressSnapshot;
  const recipientName = (snap?.name ?? `${snap?.firstName ?? ""} ${snap?.lastName ?? ""}`.trim()) || "Unknown Customer";
  const addressLine = `${snap?.streetAddress ?? snap?.addressLine1 ?? ""}, ${snap?.city ?? ""} ${snap?.postalCode ?? ""}`;
  const trackingId = order.shipment?.trackingNumber ?? `TRK-${order.orderId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="bg-white border-2 border-zinc-300 rounded-xl p-6 w-full font-mono text-zinc-900 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-zinc-200">
        <div>
          <div className="text-xl font-black tracking-tight uppercase">{carrier}</div>
          <div className="text-xs text-zinc-500 font-bold tracking-widest mt-0.5">EXPRESS SHIPPING</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-400 font-bold">PRIORITY</div>
          <div className="text-3xl font-black text-amber-600">GROUND</div>
        </div>
      </div>

      {/* Ship From */}
      <div className="mb-3">
        <div className="text-[9px] font-bold text-zinc-400 tracking-widest mb-1">SHIP FROM</div>
        <div className="text-xs font-bold text-zinc-700">MusicGear Warehouse</div>
        <div className="text-xs text-zinc-500">123 Warehouse District, Bangkok 10110</div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-zinc-300 my-3" />

      {/* Ship To */}
      <div className="mb-4">
        <div className="text-[9px] font-bold text-zinc-400 tracking-widest mb-1">SHIP TO</div>
        <div className="text-base font-black text-zinc-900">{recipientName}</div>
        <div className="text-sm text-zinc-600 mt-0.5 leading-relaxed">{addressLine}</div>
      </div>

      {/* Order Info Row */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-zinc-50 rounded-lg p-3">
        <div>
          <div className="text-[9px] font-bold text-zinc-400 tracking-widest">ORDER ID</div>
          <div className="text-xs font-bold font-mono text-zinc-800 mt-0.5">
            {order.orderId.slice(0, 8).toUpperCase()}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-zinc-400 tracking-widest">ITEMS</div>
          <div className="text-xs font-bold text-zinc-800 mt-0.5">{order.items?.length ?? 0} pcs</div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-zinc-400 tracking-widest">DATE</div>
          <div className="text-xs font-bold text-zinc-800 mt-0.5">
            {new Date().toLocaleDateString("en-GB")}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-zinc-400 tracking-widest">WEIGHT</div>
          <div className="text-xs font-bold text-zinc-800 mt-0.5">Est. 2.5 kg</div>
        </div>
      </div>

      {/* Barcode */}
      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-zinc-200">
        <BarcodeDisplay value={trackingId} />
        <div className="text-[11px] font-mono font-bold tracking-widest text-zinc-700">{trackingId}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page Content
// ──────────────────────────────────────────────────────────────────────────────

function PrintPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);

  // Printer settings
  const [printer, setPrinter] = useState("Zebra ZD421");
  const [labelSize, setLabelSize] = useState<"4x6" | "A4">("4x6");
  const [copies, setCopies] = useState(1);
  const [carrier, setCarrier] = useState("FedEx Ground");

  useEffect(() => {
    async function load() {
      try {
        const res = await getOrders();
        const found = res.orders?.find((o) => o.orderId === orderId);
        setOrder(found ?? null);
      } catch {
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (orderId) load();
    else setIsLoading(false);
  }, [orderId]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setPrinted(true);
    }, 2200);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        กำลังโหลดข้อมูลออเดอร์...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-zinc-400">
        <Package className="w-12 h-12 opacity-30" />
        <p className="text-sm">ไม่พบข้อมูลออเดอร์ที่ต้องการพิมพ์</p>
        <Link
          href="/dashboard/orders"
          className="text-amber-500 text-sm font-semibold hover:underline"
        >
          กลับไปหน้า Orders Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <Link
          href="/dashboard/orders"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Print Shipping Label
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Order ID:{" "}
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
              {order.orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        </div>
        {printed && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
            <Check className="w-4 h-4" />
            พิมพ์เรียบร้อยแล้ว
          </div>
        )}
      </div>

      {/* Main Layout: Label Preview | Printer Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT — Label Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Barcode className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">Label Preview</h3>
            <span className="text-xs text-zinc-400 ml-auto">
              {labelSize === "4x6" ? '4" × 6" (Zebra)' : "A4 Letter"}
            </span>
          </div>
          <div
            className={`transition-all duration-300 ${labelSize === "4x6" ? "max-w-[360px]" : "max-w-full"}`}
          >
            <ShippingLabelPreview order={order} carrier={carrier} />
          </div>

          {/* Copies indicator below preview */}
          <p className="text-xs text-zinc-400 text-center">
            จะพิมพ์ {copies} ชุด ผ่าน <span className="font-bold text-zinc-600 dark:text-zinc-300">{printer}</span>
          </p>
        </div>

        {/* RIGHT — Printer Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">Print Configuration</h3>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {/* Printer Model */}
            <div className="p-5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-2 uppercase tracking-wider">
                Printer Model
              </label>
              <select
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option>Zebra ZD421</option>
                <option>Zebra ZD620</option>
                <option>Zebra ZT411</option>
                <option>Brother QL-820NWB</option>
                <option>DYMO LabelWriter 550</option>
              </select>
            </div>

            {/* Carrier */}
            <div className="p-5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-2 uppercase tracking-wider">
                Shipping Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option>FedEx Ground</option>
                <option>FedEx Express</option>
                <option>DHL Express</option>
                <option>Kerry Express</option>
                <option>Flash Express</option>
                <option>Thailand Post EMS</option>
              </select>
            </div>

            {/* Label Size */}
            <div className="p-5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-3 uppercase tracking-wider">
                Label Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["4x6", "A4"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setLabelSize(size)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      labelSize === size
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className={`border-2 rounded bg-zinc-100 dark:bg-zinc-800 ${size === "4x6" ? "w-8 h-12" : "w-10 h-14"} ${
                        labelSize === size ? "border-amber-400" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                    <span className="text-sm font-bold">
                      {size === "4x6" ? '4" × 6"' : "A4 Letter"}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {size === "4x6" ? "Thermal / Zebra" : "Standard Printer"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Copies Counter */}
            <div className="p-5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-2 uppercase tracking-wider">
                Copies
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white w-12 text-center tabular-nums">
                  {copies}
                </span>
                <button
                  onClick={() => setCopies((c) => Math.min(10, c + 1))}
                  className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="text-sm text-zinc-400">ชุด</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-5 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30">
              <button
                onClick={handlePrint}
                disabled={isPrinting || printed}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังส่งไปยัง {printer}...
                  </>
                ) : printed ? (
                  <>
                    <Check className="w-4 h-4" />
                    พิมพ์เรียบร้อยแล้ว ({copies} ชุด)
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    พิมพ์ใบปะหน้า ({copies} ชุด)
                  </>
                )}
              </button>
              {printed && (
                <button
                  onClick={() => {
                    setPrinted(false);
                    setCopies(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-all"
                >
                  พิมพ์อีกครั้ง
                </button>
              )}
              <Link
                href="/dashboard/orders"
                className="w-full block text-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-all"
              >
                กลับไปหน้า Orders Queue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Exported Page (wrapped in Suspense for useSearchParams)
// ──────────────────────────────────────────────────────────────────────────────

export default function PrintLabelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] gap-2 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          กำลังโหลด...
        </div>
      }
    >
      <PrintPageContent />
    </Suspense>
  );
}
