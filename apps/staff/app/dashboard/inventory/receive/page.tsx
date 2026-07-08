"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Barcode, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type Condition = "good" | "damaged" | "missing";
type MatchStatus = "full_match" | "shortage" | "damaged";

interface LineItem {
  id: number;
  name: string;
  sku: string;
  expected: number;
  received: number;
  condition: Condition;
}

const initialItems: LineItem[] = [
  { id: 1, name: "Yamaha HS8 Studio Monitor", sku: "YM-HS8-BLK", expected: 24, received: 24, condition: "good" },
  { id: 2, name: "Focusrite Scarlett 2i2 Gen 4", sku: "FR-SC2I2-G4", expected: 50, received: 45, condition: "good" },
  { id: 3, name: "Shure SM7B Dynamic Microphone", sku: "SH-SM7B-STD", expected: 12, received: 12, condition: "damaged" },
];

function getMatchStatus(item: LineItem): MatchStatus {
  if (item.condition === "damaged") return "damaged";
  if (item.received < item.expected) return "shortage";
  return "full_match";
}

const matchBadge: Record<MatchStatus, { label: string; icon: React.ReactNode; class: string }> = {
  full_match: { label: "FULL MATCH", icon: <CheckCircle className="w-3.5 h-3.5" />, class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  shortage: { label: "SHORTAGE", icon: <AlertTriangle className="w-3.5 h-3.5" />, class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  damaged: { label: "DAMAGED", icon: <XCircle className="w-3.5 h-3.5" />, class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const conditionOptions: { value: Condition; label: string }[] = [
  { value: "good", label: "Good" },
  { value: "damaged", label: "Damaged Box" },
  { value: "missing", label: "Missing" },
];

export default function ReceiveStockPage() {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [poNumber, setPoNumber] = useState("PO-2023-1104-A");
  const [supplier, setSupplier] = useState("Yamaha Global Logistics");
  const [carrier, setCarrier] = useState("FedEx Freight");
  const [trackingId, setTrackingId] = useState("");
  const [finalized, setFinalized] = useState(false);

  const totalExpected = items.reduce((s, i) => s + i.expected, 0);
  const totalReceived = items.reduce((s, i) => s + i.received, 0);
  const discrepancies = items.filter((i) => getMatchStatus(i) !== "full_match").length;

  const updateItem = (id: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  if (finalized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white">การรับสินค้าสำเร็จ!</h3>
          <p className="text-zinc-500 mt-2">PO {poNumber} · ได้รับสินค้า {totalReceived} จาก {totalExpected} ชิ้น</p>
        </div>
        <Link href="/dashboard/inventory" className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors">
          กลับไปหน้า Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <Link href="/dashboard/inventory" className="mt-1 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Receive New Stock</h2>
          <p className="text-zinc-500 text-sm mt-1">Process incoming shipments and update inventory levels.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-colors">
          <Barcode className="w-4 h-4" />
          Scan Barcode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[304px_1fr] gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Shipment Details Form */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Shipment Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">Purchase Order (PO) Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">Supplier Name</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">Shipping Carrier</label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option>FedEx Freight</option>
                    <option>DHL Express</option>
                    <option>UPS Ground</option>
                    <option>Kerry Express</option>
                    <option>Flash Express</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">Tracking ID</label>
                  <input
                    type="text"
                    placeholder="Scan or enter..."
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Receiving Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-500 font-semibold">Total Items Expected</p>
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">{totalExpected}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-500 font-semibold">Total Received</p>
                <p className={`text-2xl font-extrabold mt-1 ${totalReceived === totalExpected ? "text-emerald-500" : "text-amber-500"}`}>{totalReceived}</p>
              </div>
            </div>
            {discrepancies > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  Stock Discrepancies
                </div>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{discrepancies}</span>
              </div>
            )}
            <div className="space-y-2 pt-2">
              <Link href="/dashboard/inventory" className="w-full block text-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </Link>
              <button
                onClick={() => setFinalized(true)}
                className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
              >
                Finalize Receipt & Update
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Line Items Table */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Received Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500 w-8">#</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500">SKU / ITEM</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-zinc-500 w-24">EXPECTED</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-zinc-500 w-28">RECEIVED</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500 w-36">CONDITION</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-zinc-500 w-32">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item, idx) => {
                  const ms = getMatchStatus(item);
                  const mb = matchBadge[ms];
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-4 text-zinc-400 font-mono">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm leading-tight">{item.name}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{item.sku}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">{item.expected}</td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={item.expected + 10}
                          value={item.received}
                          onChange={(e) => updateItem(item.id, "received", Number(e.target.value))}
                          className="w-20 text-center px-2 py-1.5 text-sm font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={item.condition}
                          onChange={(e) => updateItem(item.id, "condition", e.target.value as Condition)}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                          {conditionOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${mb.class}`}>
                          {mb.icon}
                          {mb.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Empty row hint */}
          <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center gap-2 text-zinc-400 text-sm">
            <Barcode className="w-4 h-4" />
            Scan next item or click to add manually
          </div>
        </div>
      </div>
    </div>
  );
}
