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
import { getOrders, getProducts, OrderRecord } from "@/lib/api";
import { CustomSelect } from "@/components/custom-select";

// ──────────────────────────────────────────────────────────────────────────────
// BarcodeDisplay — visual barcode made of div bars
// ──────────────────────────────────────────────────────────────────────────────

function BarcodeDisplay({ value }: { value: string }) {
  const bars = value
    .split("")
    .flatMap((c) => {
      const code = c.charCodeAt(0);
      return [code % 3 === 0, code % 5 !== 1, code % 2 === 0, true, false];
    })
    .slice(0, 80);

  return (
    <div className="flex items-end gap-px h-10" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}>
      {bars.map((thick, i) => (
        <div
          key={i}
          style={{
            backgroundColor: "#18181b",
            width: thick ? "4px" : "2px",
            height: thick ? "100%" : "70%",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ShippingLabelPreview — renders for both screen and print
// ──────────────────────────────────────────────────────────────────────────────

function ShippingLabelPreview({
  order,
  carrier,
  forPrint = false,
}: {
  order: OrderRecord;
  carrier: string;
  forPrint?: boolean;
}) {
  const snap = order.shippingAddressSnapshot;
  const recipientName =
    (snap?.receiverName ??
      snap?.name ??
      `${snap?.firstName ?? ""} ${snap?.lastName ?? ""}`.trim()) ||
    "Unknown Customer";

  const line1 = snap?.streetAddress ?? snap?.addressLine1 ?? "";
  const line2 = snap?.addressLine2 ?? "";
  const city = snap?.city ?? snap?.district ?? "";
  const region = snap?.state ?? snap?.province ?? "";
  const postal = snap?.postalCode ?? "";
  const addressLine = [line1, line2, city, region, postal].filter(Boolean).join(", ");

  const trackingId =
    order.shipment?.trackingNumber ??
    `TRK-${order.orderId.slice(0, 8).toUpperCase()}`;

  const cardStyle: React.CSSProperties = forPrint
    ? {
        background: "white",
        border: "3px solid #18181b",
        padding: "24px",
        width: "100%",
        height: "100%",
        fontFamily: "monospace",
        color: "#18181b",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }
    : {};

  const cls = forPrint ? "" : "bg-white border-2 border-zinc-350 dark:border-zinc-700 rounded-2xl p-6 w-full aspect-[2/3] flex flex-col font-mono text-zinc-900 shadow-xl transition-all";

  return (
    <div className={cls} style={cardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-zinc-200" style={forPrint ? { borderColor: "#d4d4d8" } : {}}>
        <div>
          <div className="text-xl font-black tracking-tight uppercase">{carrier}</div>
          <div className="text-xs text-zinc-500 font-bold tracking-widest mt-0.5">EXPRESS SHIPPING</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-400 font-bold">PRIORITY</div>
          <div className="text-3xl font-black" style={{ color: "#d97706" }}>GROUND</div>
        </div>
      </div>

      {/* Ship From */}
      <div className="mb-3">
        <div className="text-[9px] font-bold text-zinc-400 tracking-widest mb-1">SHIP FROM</div>
        <div className="text-xs font-bold text-zinc-700">MusicGear Warehouse</div>
        <div className="text-xs text-zinc-500">123 Warehouse District, Bangkok 10110</div>
      </div>

      <div className="border-t border-dashed border-zinc-300 my-3" />

      {/* Ship To */}
      <div className="mb-4">
        <div className="text-[9px] font-bold text-zinc-400 tracking-widest mb-1">SHIP TO</div>
        <div className="text-base font-black text-zinc-900">{recipientName}</div>
        <div className="text-sm text-zinc-600 mt-0.5 leading-relaxed">{addressLine}</div>
      </div>

      {/* Order Info Row */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-zinc-50 rounded-lg p-3" style={forPrint ? { background: "#fafafa" } : {}}>
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
      <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-zinc-200 mt-auto">
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
  const orderIdsStr = searchParams.get("orderIds") || searchParams.get("orderId");

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);

  // Printer settings
  const [printer, setPrinter] = useState("Zebra ZD421");
  const labelSize = "4x6" as const;
  const [copies, setCopies] = useState(1);
  const [carrier, setCarrier] = useState("FedEx Ground");

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          getOrders(),
          getProducts({ limit: 100 }).catch(() => ({ products: [] }))
        ]);
        const ids = orderIdsStr ? orderIdsStr.split(",") : [];
        const found = ordersRes.orders?.filter((o) => ids.includes(o.orderId)) || [];
        const sorted = [...found].sort((a, b) => ids.indexOf(a.orderId) - ids.indexOf(b.orderId));
        setOrders(sorted);

        const pm = new Map<string, string>();
        if (productsRes.products) {
          productsRes.products.forEach((p: any) => {
            pm.set(p.productId, p.name);
          });
        }
        setProductMap(pm);
      } catch {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    if (orderIdsStr) load();
    else setIsLoading(false);
  }, [orderIdsStr]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setPrinted(true);
      window.print();
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        กำลังโหลดข้อมูลออเดอร์...
      </div>
    );
  }

  if (orders.length === 0) {
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

  const idsLabel = orders.map(o => o.orderId.slice(0, 8).toUpperCase()).join(", ");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* ═══ PRINT-ONLY STYLES ═══
          Uses visibility technique:
          - body * { visibility: hidden } hides everything BUT keeps DOM intact
          - .print-only * { visibility: visible } makes only labels visible
          - @page sets exact paper size
          - No broad div resets that break barcode bars
      */}
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }

        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }

          body * {
            visibility: hidden !important;
          }

          .print-only,
          .print-only * {
            visibility: visible !important;
          }

          .print-only {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-label-page {
            width: 4in !important;
            height: 6in !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* ═══ PRINT-ONLY SECTION (hidden on screen, shown when printing) ═══ */}
      <div className="print-only">
        {orders.map((o) => (
          <div key={o.orderId} className="print-label-page">
            <ShippingLabelPreview order={o} carrier={carrier} forPrint />
          </div>
        ))}
      </div>

      {/* ═══ SCREEN UI (hidden when printing via visibility:hidden on body *) ═══ */}

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
            Print Shipping Labels
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Order ID:{" "}
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
              {idsLabel}
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

      {/* Main Layout: Label Preview | Printer Config & Checklist */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* LEFT — Screen Label Preview */}
        <div className="w-full lg:w-[380px] shrink-0 space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-2">
            <Barcode className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">Label Preview ({orders.length} ใบ)</h3>
            <span className="text-xs text-zinc-400 ml-auto">
              4" × 6" (Zebra)
            </span>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {orders.map((o) => (
              <div key={o.orderId} className="w-full">
                <ShippingLabelPreview order={o} carrier={carrier} />
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-400 text-center">
            จะพิมพ์ {copies} ชุด ผ่าน{" "}
            <span className="font-bold text-zinc-600 dark:text-zinc-300">{printer}</span>
          </p>
        </div>

        {/* RIGHT — Printer Configuration & Batch Summary */}
        <div className="flex-1 w-full space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-zinc-900 dark:text-white">Print Configuration</h3>
            </div>

            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              {/* 2-Column Grid for Fields */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Printer Model */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">
                    Printer Model
                  </label>
                  <CustomSelect
                    value={printer}
                    onChange={setPrinter}
                    options={[
                      { value: "Zebra ZD421", label: "Zebra ZD421" },
                      { value: "Zebra ZD620", label: "Zebra ZD620" },
                      { value: "Zebra ZT411", label: "Zebra ZT411" },
                      { value: "Brother QL-820NWB", label: "Brother QL-820NWB" },
                      { value: "DYMO LabelWriter 550", label: "DYMO LabelWriter 550" },
                    ]}
                    triggerClassName="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 py-2.5 h-11 w-full"
                    dropdownClassName="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-100 dark:divide-zinc-800"
                  />
                </div>

                {/* Label Size — read-only information */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">
                    Label Size
                  </label>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-zinc-250 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 h-11">
                    <div className="border border-zinc-300 dark:border-zinc-650 rounded bg-zinc-100 dark:bg-zinc-800 w-5 h-7 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200">4" × 6"</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">Thermal / Zebra</p>
                    </div>
                  </div>
                </div>

                {/* Carrier */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">
                    Shipping Carrier
                  </label>
                  <CustomSelect
                    value={carrier}
                    onChange={setCarrier}
                    options={[
                      { value: "FedEx Ground", label: "FedEx Ground" },
                      { value: "FedEx Express", label: "FedEx Express" },
                      { value: "DHL Express", label: "DHL Express" },
                      { value: "Kerry Express", label: "Kerry Express" },
                      { value: "Flash Express", label: "Flash Express" },
                      { value: "Thailand Post EMS", label: "Thailand Post EMS" },
                    ]}
                    triggerClassName="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 py-2.5 h-11 w-full"
                    dropdownClassName="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-100 dark:divide-zinc-800"
                  />
                </div>

                {/* Copies Counter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">
                    Copies
                  </label>
                  <div className="flex items-center gap-3 h-11">
                    <button
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      className="w-11 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-extrabold text-zinc-900 dark:text-white w-10 text-center tabular-nums">
                      {copies}
                    </span>
                    <button
                      onClick={() => setCopies((c) => Math.min(10, c + 1))}
                      className="w-11 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-zinc-450 dark:text-zinc-450">ชุด</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="p-6 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting || printed}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
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

          {/* Fulfillment Checklist Card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                รายการตรวจสอบสินค้าในเซ็ตนี้ (Fulfillment Checklist)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 font-semibold">
                รายการสินค้าใน {orders.length} ออเดอร์ที่จัดเตรียมอยู่ในหน้านี้
              </p>
            </div>
            <div className="p-6 divide-y divide-zinc-150 dark:divide-zinc-800/50 max-h-[380px] overflow-y-auto space-y-4">
              {orders.map((o) => {
                const recipient = (o.shippingAddressSnapshot?.receiverName ?? o.shippingAddressSnapshot?.name ?? "Unknown Customer");
                return (
                  <div key={o.orderId} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase">
                          ID: {o.orderId.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          ผู้รับ: {recipient}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {new Date(o.orderDate).toLocaleDateString("th-TH")}
                      </span>
                    </div>

                    <div className="space-y-1.5 pl-2.5 border-l-2 border-amber-500/20">
                      {o.items?.map((item) => {
                        const pName = productMap.get(item.productId) ?? "Guitar Product";
                        return (
                          <div key={item.orderItemId} className="flex items-center gap-3 text-xs text-zinc-650 dark:text-zinc-400">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                            />
                            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-150 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                              ×{item.quantity}
                            </span>
                            <span className="font-medium truncate flex-1">{pName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
