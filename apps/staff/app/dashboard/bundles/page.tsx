"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Package, CheckCircle, AlertTriangle, Plus, X, Loader2, Check, AlertCircle, ChevronDown } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { getBundles, getInventory, getProducts, deleteBundleById, BundleRecord, InventoryRecord } from "@/lib/api";
import { getAccessToken, getApiBaseUrl } from "@/lib/auth";
import { CustomSelect } from "@/components/custom-select";
import { Pagination } from "@/components/pagination";
import { useUser } from "@/hooks/useUser";

type BundleStatus = "healthy" | "low_component" | "out_of_stock";

interface BundleComponent {
  productId: string;
  sku: string;
  name: string;
  price: number;
  required: number;
  available: number;
}

interface Bundle {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  components: BundleComponent[];
  assembled: number;
  status: BundleStatus;
  description: string;
  discountType: string;
  discountValue: number;
  originalPrice: number;
  finalPrice: number;
}

const statusConfig: Record<BundleStatus, { label: string; badge: string; dot: string; icon: React.ReactNode }> = {
  healthy: {
    label: "พร้อมประกอบ",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  low_component: {
    label: "ส่วนประกอบใกล้หมด",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  out_of_stock: {
    label: "วัตถุดิบไม่พอ",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
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

function BundleRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="pl-6 py-4 space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-48" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
        </div>
      </TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-20" /></TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto" /></TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-10 mx-auto" /></TableCell>
      <TableCell className="pr-6 text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-16 inline-block" /></TableCell>
    </TableRow>
  );
}

function getPotentialBuild(bundle: Bundle): number {
  if (bundle.components.length === 0) return 0;
  const mins = bundle.components.map((c) => Math.floor(c.available / c.required));
  return Math.min(...mins);
}

// ─────────────────────────────────────────────────────
// Create Bundle Modal
// ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
// Create Bundle Modal
// ─────────────────────────────────────────────────────
interface CreateBundleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateBundleModal({ onClose, onSuccess }: CreateBundleModalProps) {
  const [form, setForm] = useState({ name: "", description: "", discountType: "percentage", discountValue: "", imageUrl: "" });
  const [productList, setProductList] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ productId: string; name: string; sku: string; quantity: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQty, setCurrentQty] = useState(1);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProducts({ limit: 150 }).then((res: any) => {
      setProductList(res.products || []);
    }).catch((err: any) => {
      console.error("Failed to load products for bundle", err);
    });
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
      const token = getAccessToken();
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch(`${apiBase}/products/upload-image`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd
      });

      if (!res.ok) throw new Error("อัปโหลดรูปภาพล้มเหลว");
      const data = await res.json();
      setForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (err: any) {
      setError(err.message || "ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = () => {
    if (!currentProductId) return;
    const prod = productList.find(p => p.productId === currentProductId);
    if (!prod) return;

    // Check if duplicate
    const exists = selectedItems.find(item => item.productId === currentProductId);
    if (exists) {
      setError("สินค้านี้ถูกเพิ่มเข้าไปในรายการส่วนประกอบแล้ว");
      return;
    }

    setError(null);
    setSelectedItems(prev => [...prev, {
      productId: prod.productId,
      name: prod.name,
      sku: prod.sku,
      quantity: Math.max(1, currentQty)
    }]);
    setCurrentProductId("");
    setCurrentQty(1);
  };

  const handleRemoveItem = (prodId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== prodId));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.discountValue) {
      setError("กรุณากรอกชื่อ Bundle และมูลค่าส่วนลด");
      return;
    }
    if (selectedItems.length === 0) {
      setError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการเพื่อจับคู่ Bundle");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
      const token = getAccessToken();
      const res = await fetch(`${apiBase}/products/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          imageUrl: form.imageUrl || undefined,
          items: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity }))
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `ผิดพลาด ${res.status}: ${res.statusText}`);
      }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถสร้าง Bundle ได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold">สร้างเซ็ตสินค้าใหม่</h3>
            <p className="text-xs text-zinc-400 mt-0.5">เลือกจับคู่สินค้าที่ต้องการจัดเซ็ตขายพร้อมกัน</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">ชื่อ Bundle *</label>
              <input type="text" placeholder="เช่น Starter Guitar Kit" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">คำอธิบาย</label>
              <input type="text" placeholder="คำบรรยายเซ็ตสินค้า (ไม่บังคับ)" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">รูปภาพบันเดิล (แนวนอน)</label>
              <div className="flex gap-4 items-center">
                <div className="h-16 w-32 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center relative flex-shrink-0">
                  {form.imageUrl ? (
                    <img 
                      src={form.imageUrl} 
                      alt="Bundle Preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-400 text-center px-2">ไม่มีรูปภาพ (แนวนอน)</span>
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="create-bundle-image-upload" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                  <label 
                    htmlFor="create-bundle-image-upload" 
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      "เลือกรูปภาพแนวนอน"
                    )}
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-1">แนะนำขนาดแนวนอน (เช่น 600x300px)</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">ประเภทส่วนลด</label>
              <CustomSelect
                value={form.discountType}
                onChange={(val) => {
                  setForm(prev => {
                    let nextVal = prev.discountValue;
                    if (val === "percentage" && Number(nextVal) > 100) {
                      nextVal = "100";
                    }
                    return { ...prev, discountType: val, discountValue: nextVal };
                  });
                }}
                options={[
                  { value: "percentage", label: "เปอร์เซ็นต์ (%)" },
                  { value: "fixed_amount", label: "จำนวนเงิน (บาท)" }
                ]}
                triggerClassName="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 py-2.5 h-10"
                dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-100 dark:divide-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">มูลค่าส่วนลด *</label>
              <input type="number" min="1" placeholder={form.discountType === "percentage" ? "เช่น 10 (10%)" : "เช่น 500 (500 บาท)"} value={form.discountValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) > 0) {
                    if (form.discountType === "percentage" && Number(val) > 100) return;
                    setForm(prev => ({ ...prev, discountValue: val }));
                  }
                }}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
          </div>

          {/* Add Components Selector */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">เลือกสินค้ามาจับคู่เซ็ต</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">เลือกสินค้า</label>
                <CustomSelect
                  value={currentProductId}
                  onChange={setCurrentProductId}
                  options={[
                    { value: "", label: "-- เลือกสินค้า --" },
                    ...productList.map(p => ({ value: p.productId, label: `${p.name} (${p.sku})` }))
                  ]}
                  triggerClassName="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 py-2.5 h-10 text-xs"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>
              <div className="w-20">
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">จำนวน</label>
                <input type="number" min={1} value={currentQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) > 0) {
                      if (val !== "") setCurrentQty(Math.max(1, Number(val)));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-center font-bold" />
              </div>
              <button type="button" onClick={handleAddItem}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-750 dark:hover:bg-zinc-700 text-xs font-bold text-white transition-colors shrink-0">
                เพิ่มสินค้า
              </button>
            </div>
          </div>

          {/* List of Added Components */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">รายการสินค้าในเซ็ต ({selectedItems.length})</h5>
            {selectedItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                ยังไม่มีการเลือกสินค้ามาเข้าเซ็ต
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950/20">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-2 px-3 text-zinc-500">ชื่อสินค้า (SKU)</th>
                      <th className="text-center py-2 px-3 text-zinc-500 w-20">จำนวน</th>
                      <th className="text-right py-2 px-3 text-zinc-500 w-16">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {selectedItems.map(item => (
                      <tr key={item.productId} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20">
                        <td className="py-2 px-3">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" onClick={() => handleRemoveItem(item.productId)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />สร้าง Bundle สำเร็จ!
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 bg-zinc-50 dark:bg-zinc-900/50">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={isSaving || success}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? "กำลังบันทึก..." : "สร้าง Bundle"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Edit Bundle Modal
// ─────────────────────────────────────────────────────
interface EditBundleModalProps {
  bundle: Bundle;
  onClose: () => void;
  onSuccess: () => void;
}

function EditBundleModal({ bundle, onClose, onSuccess }: EditBundleModalProps) {
  const [form, setForm] = useState({
    name: bundle.name,
    description: bundle.description,
    discountType: bundle.discountType,
    discountValue: String(bundle.discountValue),
    imageUrl: bundle.imageUrl || ""
  });
  const [productList, setProductList] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ productId: string; name: string; sku: string; quantity: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQty, setCurrentQty] = useState(1);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProducts({ limit: 150 }).then((res: any) => {
      setProductList(res.products || []);
    }).catch((err: any) => {
      console.error("Failed to load products for editing bundle", err);
    });

    if (bundle && Array.isArray(bundle.components)) {
      setSelectedItems(bundle.components.map(comp => ({
        productId: comp.productId,
        name: comp.name,
        sku: comp.sku,
        quantity: comp.required
      })));
    }
  }, [bundle]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
      const token = getAccessToken();
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch(`${apiBase}/products/upload-image`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd
      });

      if (!res.ok) throw new Error("อัปโหลดรูปภาพล้มเหลว");
      const data = await res.json();
      setForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (err: any) {
      setError(err.message || "ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = () => {
    if (!currentProductId) return;
    const prod = productList.find(p => p.productId === currentProductId);
    if (!prod) return;

    const exists = selectedItems.find(item => item.productId === currentProductId);
    if (exists) {
      setError("สินค้านี้ถูกเพิ่มเข้าไปในรายการส่วนประกอบแล้ว");
      return;
    }

    setError(null);
    setSelectedItems(prev => [...prev, {
      productId: prod.productId,
      name: prod.name,
      sku: prod.sku,
      quantity: Math.max(1, currentQty)
    }]);
    setCurrentProductId("");
    setCurrentQty(1);
  };

  const handleRemoveItem = (prodId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== prodId));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.discountValue) {
      setError("กรุณากรอกชื่อ Bundle และมูลค่าส่วนลด");
      return;
    }
    if (selectedItems.length === 0) {
      setError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการเพื่อจับคู่ Bundle");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
      const token = getAccessToken();
      const res = await fetch(`${apiBase}/products/bundles/${bundle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          imageUrl: form.imageUrl || undefined,
          items: selectedItems.map(item => ({ productId: item.productId, quantity: item.quantity }))
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `ผิดพลาด ${res.status}: ${res.statusText}`);
      }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถแก้ไข Bundle ได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold">แก้ไขเซ็ตสินค้า (Edit Bundle)</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{bundle.sku}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">ชื่อ Bundle *</label>
              <input type="text" placeholder="เช่น Starter Guitar Kit" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">คำอธิบาย</label>
              <input type="text" placeholder="คำบรรยายเซ็ตสินค้า (ไม่บังคับ)" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">รูปภาพบันเดิล (แนวนอน)</label>
              <div className="flex gap-4 items-center">
                <div className="h-16 w-32 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center relative flex-shrink-0">
                  {form.imageUrl ? (
                    <img 
                      src={`${getApiBaseUrl()}/products/images/${form.imageUrl}`} 
                      alt="Bundle Preview" 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-400 text-center px-2">ไม่มีรูปภาพ (แนวนอน)</span>
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="edit-bundle-image-upload" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                  <label 
                    htmlFor="edit-bundle-image-upload" 
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      "เลือกรูปภาพแนวนอน"
                    )}
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-1">แนะนำขนาดแนวนอน (เช่น 600x300px)</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">ประเภทส่วนลด</label>
              <CustomSelect
                value={form.discountType}
                onChange={(val) => {
                  setForm(prev => {
                    let nextVal = prev.discountValue;
                    if (val === "percentage" && Number(nextVal) > 100) {
                      nextVal = "100";
                    }
                    return { ...prev, discountType: val, discountValue: nextVal };
                  });
                }}
                options={[
                  { value: "percentage", label: "เปอร์เซ็นต์ (%)" },
                  { value: "fixed_amount", label: "จำนวนเงิน (บาท)" }
                ]}
                triggerClassName="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 py-2.5 h-10"
                dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-100 dark:divide-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">มูลค่าส่วนลด *</label>
              <input type="number" min="1" placeholder={form.discountType === "percentage" ? "เช่น 10 (10%)" : "เช่น 500 (500 บาท)"} value={form.discountValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) > 0) {
                    if (form.discountType === "percentage" && Number(val) > 100) return;
                    setForm(prev => ({ ...prev, discountValue: val }));
                  }
                }}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
          </div>

          {/* Add Components Selector */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">เลือกสินค้ามาจับคู่เซ็ตเพิ่มเติม</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">เลือกสินค้า</label>
                <CustomSelect
                  value={currentProductId}
                  onChange={setCurrentProductId}
                  options={[
                    { value: "", label: "-- เลือกสินค้า --" },
                    ...productList.map(p => ({ value: p.productId, label: `${p.name} (${p.sku})` }))
                  ]}
                  triggerClassName="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 py-2.5 h-10 text-xs"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>
              <div className="w-20">
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">จำนวน</label>
                <input type="number" min={1} value={currentQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) > 0) {
                      if (val !== "") setCurrentQty(Math.max(1, Number(val)));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-center font-bold" />
              </div>
              <button type="button" onClick={handleAddItem}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-750 dark:hover:bg-zinc-700 text-xs font-bold text-white transition-colors shrink-0">
                เพิ่มสินค้า
              </button>
            </div>
          </div>

          {/* List of Added Components */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">รายการสินค้าในเซ็ต ({selectedItems.length})</h5>
            {selectedItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                ยังไม่มีการเลือกสินค้ามาเข้าเซ็ต
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950/20">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-2 px-3 text-zinc-500">ชื่อสินค้า (SKU)</th>
                      <th className="text-center py-2 px-3 text-zinc-500 w-20">จำนวน</th>
                      <th className="text-right py-2 px-3 text-zinc-500 w-16">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {selectedItems.map(item => (
                      <tr key={item.productId} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20">
                        <td className="py-2 px-3">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          <button type="button" onClick={() => handleRemoveItem(item.productId)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />แก้ไข Bundle สำเร็จ!
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 bg-zinc-50 dark:bg-zinc-900/50">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={isSaving || success}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function BundlesPage() {
  const { isAdmin } = useUser();
  const [search, setSearch] = useState("");
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  // Status Filter state
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bundleRes = await getBundles();
      const invRes = await getInventory();
      
      const invMap = new Map(invRes.inventories?.map((i) => [i.productId, i]) ?? []);
      const mapped: Bundle[] = (bundleRes.bundles ?? []).map((b) => {
        const components: BundleComponent[] = (b.items ?? []).map((item) => {
          const inv = invMap.get(item.productId);
          return {
            productId: item.productId,
            sku: item.product?.sku ?? "UNKNOWN",
            name: item.product?.name ?? "Unknown Product",
            price: Number(item.product?.price ?? 0),
            required: item.quantity,
            available: Math.max(0, (inv?.quantity ?? 0) - (inv?.reservedQuantity ?? 0)),
          };
        });

        // Compute potential build
        const mins = components.map((c) => Math.floor(c.available / c.required));
        const potential = components.length > 0 ? Math.min(...mins) : 0;

        let status: BundleStatus = "healthy";
        if (potential === 0) {
          status = "out_of_stock";
        } else if (potential < 5) {
          status = "low_component";
        }

        let originalPrice = 0;
        for (const c of components) originalPrice += (c.price || 0) * c.required;
        let finalPrice = originalPrice;
        const dType = b.discountType ?? "percentage";
        const dVal = Number(b.discountValue ?? 0);
        if (dType === "percentage") {
          finalPrice = originalPrice * (1 - dVal / 100);
        } else {
          finalPrice = originalPrice - dVal;
        }
        finalPrice = Math.max(0, finalPrice);

        return {
          id: b.bundleId,
          name: b.name,
          sku: `BND-${b.name.replace(/\s+/g, "-").toUpperCase()}`,
          components,
          assembled: potential,
          status,
          description: b.description ?? "ไม่มีคำอธิบายเพิ่มเติมสำหรับเซ็ตนี้",
          discountType: b.discountType ?? "percentage",
          discountValue: b.discountValue ?? 0,
          imageUrl: b.imageUrl || null,
          originalPrice,
          finalPrice
        };
      });
      setBundles(mapped);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลเซ็ตสินค้าได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = bundles.filter((b) => {
    const matchSearch = search === "" ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "all" || b.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedBundles = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalActive = bundles.length;
  const healthy = bundles.filter((b) => b.status === "healthy").length;
  const stockIssues = bundles.filter((b) => b.status !== "healthy").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">จัดการเซ็ตสินค้า</h2>
          <p className="text-zinc-500 text-sm mt-1">ติดตามสถานะการจัดเซ็ตและความพร้อมของสินค้าในแต่ละเซ็ต</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            สร้าง Bundle ใหม่
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
            {[1, 2].map((n) => <div key={n} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards - Upscaled for better proportion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 shadow-sm hover:shadow-md transition-all duration-300 min-h-[160px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-zinc-500 dark:text-[#ddc1b3] tracking-[0.7px]">Bundle ทั้งหมด</span>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-5">
                <p className="text-5xl font-black text-zinc-900 dark:text-[#e5e1e6] tracking-tight leading-none">{totalActive}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">รายการ Bundle ทั้งหมดในระบบ</p>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 shadow-sm hover:shadow-md transition-all duration-300 min-h-[160px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-zinc-500 dark:text-[#ddc1b3] tracking-[0.7px]">พร้อมประกอบ</span>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="mt-5">
                <p className="text-5xl font-black text-emerald-500 tracking-tight leading-none">{healthy}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">มีสินค้าส่วนประกอบเพียงพอ</p>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 shadow-sm hover:shadow-md transition-all duration-300 min-h-[160px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-zinc-500 dark:text-[#ddc1b3] tracking-[0.7px]">วัตถุดิบไม่พอ / มีปัญหา</span>
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <div className="mt-5 flex flex-col justify-end">
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-red-500 leading-none">{stockIssues}</p>
                  <p className="text-xs text-zinc-400 font-bold">รายการ</p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">ขาดสินค้าวัตถุดิบบางรายการ</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">ตารางสรุปเซ็ตสินค้า</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อเซ็ต, SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-full sm:w-60"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors shrink-0 ${
                    showFilters
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  กรองข้อมูล
                </button>
              </div>
            </div>

            {/* Collapsible Status Filter Dropdown */}
            {showFilters && (
              <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-200">
                <div className="max-w-xs">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5">สถานะความพร้อม</label>
                  <CustomSelect
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={[
                      { value: "all", label: "สถานะทั้งหมด" },
                      { value: "healthy", label: "พร้อมประกอบ" },
                      { value: "low_component", label: "ส่วนประกอบใกล้หมด" },
                      { value: "out_of_stock", label: "วัตถุดิบไม่พอ" }
                    ]}
                    triggerClassName="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 text-xs py-2 px-3 h-9"
                    dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            )}

            <div className="overflow-x-auto w-full">
              <Table className="min-w-[800px] md:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold pl-6 text-xs uppercase tracking-wider">เซ็ตสินค้า</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">ราคา (บาท)</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">สถานะวัตถุดิบ</TableHead>
                  <TableHead className="font-bold text-center text-xs uppercase tracking-wider">ประกอบแล้ว</TableHead>
                  <TableHead className="font-bold text-center text-xs uppercase tracking-wider">ผลิตได้สูงสุด</TableHead>
                  <TableHead className="font-bold text-right pr-6 text-xs uppercase tracking-wider">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-zinc-400">ไม่พบเซ็ตสินค้าที่ตรงกัน</TableCell>
                  </TableRow>
                ) : (
                  paginatedBundles.map((bundle) => {
                    const sc = statusConfig[bundle.status];
                    const potential = getPotentialBuild(bundle);
                    return (
                      <TableRow key={bundle.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-start gap-4">
                            {bundle.imageUrl ? (
                              <img src={bundle.imageUrl} alt={bundle.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-800 bg-white" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white text-sm">{bundle.name}</div>
                              <div className="text-xs text-zinc-400 font-mono mt-0.5">{bundle.sku}</div>
                          <div className="mt-2 space-y-1">
                            {bundle.components.map((comp) => (
                                  <div key={comp.sku} className="flex items-center gap-2 text-xs">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${comp.available === 0 ? "bg-red-500" : comp.available < comp.required * 5 ? "bg-blue-600" : "bg-blue-500"}`} />
                                    <span className="text-zinc-500 dark:text-zinc-400">×{comp.required} {comp.name}</span>
                                    <span className={`ml-auto font-semibold ${comp.available === 0 ? "text-red-500" : "text-zinc-600 dark:text-zinc-300"}`}>
                                      (เหลือ {comp.available} ชิ้น)
                                    </span>
                                  </div>
                            ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="font-bold text-zinc-900 dark:text-white">฿{bundle.finalPrice.toLocaleString()}</div>
                          {bundle.originalPrice > bundle.finalPrice && (
                            <div className="text-[10px] text-zinc-400 line-through">฿{bundle.originalPrice.toLocaleString()}</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center">
                            <Badge variant="outline" className={`text-[12px] px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${sc.badge}`}>
                              {sc.icon}
                              {sc.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4 font-bold text-zinc-900 dark:text-white text-lg">{bundle.assembled}</TableCell>
                        <TableCell className="text-center py-4">
                          <span className={`text-lg font-extrabold ${potential === 0 ? "text-red-500" : "text-zinc-900 dark:text-white"}`}>
                            {potential}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedBundle(bundle)}
                              className="px-3 py-1.5 text-sm font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                            >
                              ดูรายละเอียด
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setEditingBundle(bundle)}
                                className="px-3 py-1.5 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                              >
                                แก้ไข
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalEntries={filtered.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateBundleModal onClose={() => setShowCreateModal(false)} onSuccess={loadData} />
      )}

      {selectedBundle && (
        <BundleDetailModal bundle={selectedBundle} onClose={() => setSelectedBundle(null)} onSuccess={loadData} />
      )}

      {editingBundle && (
        <EditBundleModal bundle={editingBundle} onClose={() => setEditingBundle(null)} onSuccess={loadData} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Bundle Detail Modal Component
// ─────────────────────────────────────────────────────
interface BundleDetailModalProps {
  bundle: Bundle;
  onClose: () => void;
  onSuccess: () => void;
}

function BundleDetailModal({ bundle, onClose, onSuccess }: BundleDetailModalProps) {
  const { isAdmin } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabels: Record<string, string> = {
    healthy: "พร้อมประกอบสมบูรณ์",
    low_component: "ส่วนประกอบสต็อกเหลือน้อย",
    out_of_stock: "วัตถุดิบหมด / ไม่พอประกอบ",
  };

  const handleDelete = async () => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบเซ็ตสินค้า "${bundle.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      const token = getAccessToken();
      const res = await deleteBundleById(bundle.id, token || undefined);
      if (res.status !== "ok") {
        throw new Error(res.message ?? "Failed to delete bundle");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "ไม่สามารถลบเซ็ตสินค้าได้");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold">รายละเอียดเซ็ตสินค้า (Bundle Detail)</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{bundle.sku}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Main Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-bold leading-tight">{bundle.name}</h4>
              <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                bundle.status === "healthy" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                bundle.status === "low_component" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {statusLabels[bundle.status]}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
              {bundle.description}
            </p>
          </div>

          {/* Discount Details */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-200 dark:border-zinc-800 py-4 text-sm">
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">ประเภทส่วนลด</span>
              <span className="font-bold">
                {bundle.discountType === "percentage" ? "เปอร์เซ็นต์ (%)" : "จำนวนเงินคงที่ (บาท)"}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">มูลค่าส่วนลด</span>
              <span className="font-bold text-amber-500 text-lg">
                {bundle.discountType === "percentage" ? `${bundle.discountValue}%` : `฿${bundle.discountValue.toLocaleString("th-TH")}`}
              </span>
            </div>
          </div>

          {/* Component Inventory Table */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">รายการส่วนประกอบภายในเซ็ต</h5>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950/20">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-250 dark:border-zinc-800">
                    <th className="text-left py-2.5 px-4 font-bold text-zinc-500">ชื่อส่วนประกอบ (SKU)</th>
                    <th className="text-center py-2.5 px-4 font-bold text-zinc-500 w-24">จำนวนที่ใช้</th>
                    <th className="text-center py-2.5 px-4 font-bold text-zinc-500 w-24">มีในคลัง</th>
                    <th className="text-right py-2.5 px-4 font-bold text-zinc-500 w-28 pr-4">ความเพียงพอ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {bundle.components.map((comp) => {
                    const sufficient = comp.available >= comp.required;
                    return (
                      <tr key={comp.sku} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20">
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-250">{comp.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{comp.sku}</p>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-zinc-700 dark:text-zinc-350">{comp.required}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-zinc-700 dark:text-zinc-350">{comp.available}</td>
                        <td className="py-2.5 px-4 text-right pr-4">
                          <span className={`font-bold px-2 py-0.5 rounded text-[12px] ${
                            sufficient ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" :
                            "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                          }`}>
                            {sufficient ? "✓ เพียงพอ" : "✗ ไม่เพียงพอ"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assembly Stats */}
          <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
            <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider block">ผลิตเพิ่มได้สูงสุด (พร้อมขาย)</span>
            <p className={`text-3xl font-black mt-1 ${bundle.assembled === 0 ? "text-red-500" : "text-emerald-500"}`}>
              {bundle.assembled} ชุด
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center ${isAdmin ? "justify-between" : "justify-end"}`}>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-750 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              ลบเซ็ตสินค้า
            </button>
          )}
          <button onClick={onClose} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
