"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Barcode, CheckCircle, AlertTriangle, XCircle, Plus, Loader2, X, ScanLine, Zap, ChevronDown } from "lucide-react";
import { getProducts, adjustStock, ProductRecord } from "@/lib/api";

type Condition = "good" | "damaged" | "missing";
type MatchStatus = "full_match" | "shortage" | "damaged";

interface LineItem {
  id: string; // productId
  name: string;
  sku: string;
  expected: number;
  received: number | string;
  condition: Condition;
}

function getMatchStatus(item: LineItem): MatchStatus {
  if (item.condition === "damaged") return "damaged";
  const rec = typeof item.received === "string" ? (parseInt(item.received, 10) || 0) : item.received;
  if (rec < item.expected) return "shortage";
  return "full_match";
}

const matchBadge: Record<MatchStatus, { label: string; icon: React.ReactNode; class: string }> = {
  full_match: { label: "ครบจำนวน", icon: <CheckCircle className="w-3.5 h-3.5" />, class: "bg-emerald-100 text-green-600 dark:bg-emerald-500/10 dark:text-emerald-450" },
  shortage: { label: "ขาดจำนวน", icon: <AlertTriangle className="w-3.5 h-3.5" />, class: "bg-amber-100 text-orange-600 dark:bg-amber-500/10 dark:text-amber-450" },
  damaged: { label: "ชำรุดเสียหาย", icon: <XCircle className="w-3.5 h-3.5" />, class: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-450" },
};

const conditionOptions: { value: Condition; label: string }[] = [
  { value: "good", label: "ปกติ / สมบูรณ์" },
  { value: "damaged", label: "กล่องชำรุด / เสียหาย" },
  { value: "missing", label: "สูญหาย / ไม่ครบ" },
];

export default function ReceiveStockPage() {
  const [productList, setProductList] = useState<ProductRecord[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [expectedQty, setExpectedQty] = useState(10);
  
  const [poNumber, setPoNumber] = useState("PO-2026-0708-A");
  const [supplier, setSupplier] = useState("Yamaha Global Logistics");
  const [carrier, setCarrier] = useState("FedEx Freight");
  const [trackingId, setTrackingId] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Barcode scanner state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleSimulateScan = () => {
    setScanResult(null);
    setScanError(null);
    setIsScanning(true);
    // Simulate a 1.5s scan delay
    setTimeout(() => {
      const available = productList.filter(p => !items.some(i => i.id === p.productId));
      if (available.length === 0) {
        setScanError("ไม่พบสินค้าที่สแกนได้เพิ่มเติม (ทุกรายการถูกเพิ่มแล้ว)");
        setIsScanning(false);
        return;
      }
      const randomProd = available[Math.floor(Math.random() * available.length)];
      if (!randomProd) {
        setScanError("เกิดข้อผิดพลาดในการเลือกสินค้า");
        setIsScanning(false);
        return;
      }
      setScanResult(randomProd.sku);
      setIsScanning(false);
      // Auto-add after showing the result for 0.8s
      setTimeout(() => {
        setItems(prev => [...prev, {
          id: randomProd.productId,
          name: randomProd.name,
          sku: randomProd.sku,
          expected: 1,
          received: 1,
          condition: "good",
        }]);
        setShowScanModal(false);
        setScanResult(null);
      }, 800);
    }, 1500);
  };

  useEffect(() => {
    async function init() {
      try {
        const prodRes = await getProducts({ limit: 100 });
        setProductList(prodRes.products);
        
        // Pre-fill with the first 3 products to make it look ready
        if (prodRes.products.length > 0) {
          const prefilled: LineItem[] = prodRes.products.slice(0, 3).map((p, idx) => ({
            id: p.productId,
            name: p.name,
            sku: p.sku,
            expected: idx === 1 ? 50 : idx === 2 ? 12 : 24,
            received: idx === 1 ? 45 : idx === 2 ? 12 : 24,
            condition: idx === 2 ? "damaged" : "good",
          }));
          setItems(prefilled);
        }
      } catch (e: any) {
        setError("ไม่สามารถดึงข้อมูลรายการสินค้าเพื่อรับเข้าคลังได้");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const totalExpected = items.reduce((s, i) => s + i.expected, 0);
  const totalReceived = items.reduce((s, i) => s + (typeof i.received === "string" ? (parseInt(i.received, 10) || 0) : i.received), 0);
  const discrepancies = items.filter((i) => getMatchStatus(i) !== "full_match").length;

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = productList.find(p => p.productId === selectedProductId);
    if (!prod) return;
    
    // Check duplicate
    if (items.some(item => item.id === selectedProductId)) {
      alert("มีสินค้านี้ในรายการรับเข้าอยู่แล้ว");
      return;
    }

    setItems(prev => [...prev, {
      id: prod.productId,
      name: prod.name,
      sku: prod.sku,
      expected: expectedQty,
      received: expectedQty,
      condition: "good"
    }]);
    setSelectedProductId("");
  };

  const handleFinalize = async () => {
    if (items.length === 0) {
      alert("กรุณาเพิ่มสินค้าลงในรายการก่อน");
      return;
    }

    // Check for discrepancies (quantity mismatch or damaged condition)
    if (discrepancies > 0) {
      const confirmProceed = window.confirm(
        `มีสินค้าที่ได้รับจริงไม่ตรงกับจำนวนคาดหวัง หรือสภาพสินค้าชำรุดเสียหาย ทั้งหมด ${discrepancies} รายการ คุณยังคงต้องการยืนยันการรับเข้าคลังสินค้าใช่หรือไม่?`
      );
      if (!confirmProceed) return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Loop through received items and adjust stock
      for (const item of items) {
        const recQty = typeof item.received === "string" ? (parseInt(item.received, 10) || 0) : item.received;
        if (recQty > 0) {
          await adjustStock({
            productId: item.id,
            changeQty: recQty,
            action: "receive",
          });
        }
      }
      setFinalized(true);
    } catch (e: any) {
      setError(e.message ?? "เกิดข้อผิดพลาดในการบันทึกสต็อกสินค้า");
    } finally {
      setIsSaving(false);
    }
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
          กลับไปหน้าคลังสินค้า
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <Link href="/dashboard/inventory" className="mt-1 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">รับสินค้าใหม่เข้าคลัง</h2>
          <p className="text-zinc-500 text-sm mt-1">บันทึกและตรวจสอบสินค้าที่รับเข้าคลังสินค้า</p>
        </div>
        <button
          onClick={() => { setShowScanModal(true); setScanResult(null); setScanError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-semibold transition-colors"
        >
          <Barcode className="w-4 h-4" />
          สแกนบาร์โค้ด
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Shipment Details Form */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">รายละเอียดการจัดส่ง</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">เลขที่ใบสั่งซื้อ (PO)</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">ชื่อผู้จำหน่าย</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">บริษัทขนส่ง</label>
                  <div className="relative group">
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer appearance-none"
                    >
                      <option>FedEx Freight</option>
                      <option>DHL Express</option>
                      <option>UPS Ground</option>
                      <option>Kerry Express</option>
                      <option>Flash Express</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none transition-transform duration-200 group-focus-within:rotate-180" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">หมายเลขติดตาม (Tracking)</label>
                  <input
                    type="text"
                    placeholder="สแกนหรือระบุ..."
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">สรุปการรับสินค้า</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/55 p-4 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">จำนวนคาดหวัง</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-[#e5e1e6] mt-2 leading-none">{totalExpected}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/55 p-4 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">ได้รับจริง</p>
                <p className={`text-3xl font-black mt-2 leading-none ${totalReceived === totalExpected ? "text-emerald-500" : "text-[#ffb68d]"}`}>{totalReceived}</p>
              </div>
            </div>
            {discrepancies > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  จำนวนไม่ตรงเกณฑ์
                </div>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{discrepancies} รายการ</span>
              </div>
            )}
            <div className="space-y-2 pt-2">
              <Link href="/dashboard/inventory" className="w-full block text-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                ยกเลิก
              </Link>
              {error && <p className="text-xs text-red-500 text-center font-semibold">{error}</p>}
              <button
                onClick={handleFinalize}
                disabled={isSaving || isLoading}
                className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                ยืนยันการรับเข้าสต็อก
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Line Items Table */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">รายการสินค้าที่นำส่งคลัง</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500 w-8 pl-6">#</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500">SKU / ชื่อสินค้า</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-zinc-500 w-24">คาดหวัง</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-zinc-500 w-28">รับจริง</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-zinc-500 w-64">สภาพสินค้า</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-zinc-500 w-32">สถานะ</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-zinc-500 w-16 pr-6">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-zinc-400">ยังไม่มีสินค้าในรายการรับเข้า กรุณาเลือกสินค้าและกดเพิ่มรายการ</td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const ms = getMatchStatus(item);
                    const mb = matchBadge[ms];
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-4 text-zinc-400 font-mono pl-6">{idx + 1}</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm leading-tight">{item.name}</div>
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">{item.sku}</div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">{item.expected}</td>
                        <td className="py-4 px-4 text-center">
                          <input
                            type="number"
                            min={0}
                            max={item.expected + 10}
                            value={item.received}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                updateItem(item.id, "received", "");
                              } else {
                                const parsed = parseInt(val, 10);
                                updateItem(item.id, "received", isNaN(parsed) ? 0 : parsed);
                              }
                            }}
                            className="w-20 text-center px-3 py-1 text-sm font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="relative group w-full">
                            <select
                              value={item.condition}
                              onChange={(e) => updateItem(item.id, "condition", e.target.value as Condition)}
                              className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer appearance-none"
                            >
                              {conditionOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none transition-transform duration-200 group-focus-within:rotate-180" />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${mb.class}`}>
                            {mb.icon}
                            {mb.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 pr-6 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-xl hover:bg-red-55 dark:hover:bg-red-500/10"
                            title="ลบรายการ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Add Item form */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 block mb-1">เลือกสินค้าที่ต้องการรับเข้า</label>
              <div className="relative group">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer appearance-none"
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {productList.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none transition-transform duration-200 group-focus-within:rotate-180" />
              </div>
            </div>
            <div className="w-full sm:w-28">
              <label className="text-[10px] font-bold text-zinc-400 block mb-1">จำนวนที่คาดหวัง</label>
              <input
                type="number"
                min={1}
                value={expectedQty}
                onChange={(e) => setExpectedQty(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold text-center"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="px-4 py-2.5 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Barcode Scanner Modal */}
    {showScanModal && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-amber-400" />
              <span className="text-white font-bold">เครื่องสแกนบาร์โค้ด</span>
            </div>
            <button onClick={() => setShowScanModal(false)} className="text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Viewport */}
          <div className="relative bg-zinc-900 mx-6 mt-6 rounded-xl overflow-hidden" style={{ height: 180 }}>
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br" />

            {/* Scanning beam animation */}
            {isScanning && (
              <div
                className="absolute left-4 right-4 h-0.5 bg-amber-400 shadow-[0_0_10px_3px_rgba(251,191,36,0.5)]"
                style={{ animation: "scanBeam 1.2s ease-in-out infinite", top: "50%" }}
              />
            )}

            {/* Result flash */}
            {scanResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-500/10">
                <Zap className="w-8 h-8 text-emerald-400" />
                <span className="text-emerald-300 font-mono font-bold text-sm">{scanResult}</span>
                <span className="text-emerald-400/70 text-xs">กำลังเพิ่มสินค้า...</span>
              </div>
            )}

            {/* Idle state */}
            {!isScanning && !scanResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Barcode className="w-10 h-10 opacity-30" />
                <span className="text-xs">กดปุ่มสแกนด้านล่างเพื่อเริ่มสแกน</span>
              </div>
            )}
          </div>

          {/* Error */}
          {scanError && <p className="text-xs text-red-400 text-center mt-3 px-6">{scanError}</p>}

          {/* Actions */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleSimulateScan}
              disabled={isScanning || !!scanResult}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {isScanning ? "กำลังสแกน..." : "จำลองการสแกน"}
            </button>
            <button
              onClick={() => setShowScanModal(false)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm font-medium transition-all"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Scan Beam Keyframes */}
    <style>{`
      @keyframes scanBeam {
        0%, 100% { transform: translateY(-60px); opacity: 0.4; }
        50% { transform: translateY(60px); opacity: 1; }
      }
    `}</style>
    </>
  );
}
