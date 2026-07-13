"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBundle, updateBundle, getProducts, type BundleRecord, type ProductRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { ChevronLeft, Save, Loader2, X, Plus, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

interface BundleFormProps {
  initialData?: BundleRecord;
  isEdit?: boolean;
}

export function BundleForm({ initialData, isEdit = false }: BundleFormProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    discountType: initialData?.discountType || "percentage",
    discountValue: initialData?.discountValue?.toString() || "",
  });

  const [bundleItems, setBundleItems] = useState<{ productId: string; quantity: number; product?: any }[]>(
    initialData?.items?.map(i => ({ productId: i.productId, quantity: i.quantity, product: i.product })) || []
  );

  const [availableProducts, setAvailableProducts] = useState<ProductRecord[]>([]);
  const [searchProduct, setSearchProduct] = useState("");

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const res = await getProducts({ limit: 500, status: "active" }, token);
        setAvailableProducts(res.products);
      } catch (err) {
        console.error("Failed to load products for bundle", err);
      }
    };
    fetchDropdowns();
  }, []);

  const handleAddItem = (productId: string) => {
    if (bundleItems.find(i => i.productId === productId)) return; // Already added
    const product = availableProducts.find(p => p.productId === productId);
    setBundleItems([...bundleItems, { productId, quantity: 1, product }]);
    setSearchProduct("");
  };

  const handleRemoveItem = (productId: string) => {
    setBundleItems(bundleItems.filter(i => i.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setBundleItems(bundleItems.map(i => i.productId === productId ? { ...i, quantity } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.discountType || !formData.discountValue) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    if (bundleItems.length === 0) {
      setError("กรุณาเพิ่มสินค้าลงในเซ็ตอย่างน้อย 1 รายการ");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        clearSession();
        router.push("/");
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        items: bundleItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };

      if (isEdit && initialData) {
        await updateBundle(initialData.bundleId, payload, token);
      } else {
        await createBundle(payload, token);
      }
      
      router.push("/dashboard/bundles");
    } catch (err: any) {
      setError(err.message ?? "เกิดข้อผิดพลาดในการบันทึกเซ็ตสินค้า");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  ).filter(p => !bundleItems.find(i => i.productId === p.productId));

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bundles" className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-500" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{isEdit ? "แก้ไขเซ็ตสินค้า" : "สร้างเซ็ตสินค้าใหม่"}</h2>
          <p className="text-zinc-500 mt-1">{isEdit ? "แก้ไขข้อมูลและการจัดกลุ่มสินค้า" : "สร้างกลุ่มสินค้าเพื่อจัดโปรโมชัน"}</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">ข้อมูลพื้นฐาน</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ชื่อเซ็ตสินค้า <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="เช่น เซ็ตมือใหม่กีตาร์โปร่ง" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">รายละเอียด</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none" placeholder="อธิบายเกี่ยวกับเซ็ตสินค้านี้..." />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">รายการสินค้าในเซ็ต <span className="text-rose-500">*</span></h3>
                <span className="text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">{bundleItems.length} รายการ</span>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ค้นหาสินค้าเพื่อเพิ่ม..." 
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
                {searchProduct && (
                  <button type="button" onClick={() => setSearchProduct("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {searchProduct && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-zinc-500 text-sm">ไม่พบสินค้า</div>
                    ) : (
                      filteredProducts.map(p => (
                        <button
                          key={p.productId}
                          type="button"
                          onClick={() => handleAddItem(p.productId)}
                          className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 text-left"
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-white text-sm">{p.name}</div>
                            <div className="text-xs text-zinc-500 font-mono mt-0.5">{p.sku}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">฿{Number(p.price).toLocaleString("th-TH")}</span>
                            <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                {bundleItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 min-h-[200px]">
                    <Package className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">ยังไม่มีสินค้าในเซ็ต</p>
                  </div>
                ) : (
                  bundleItems.map(item => (
                    <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 group">
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900 dark:text-white text-sm">{item.product?.name || "Unknown Product"}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{item.product?.sku || item.productId}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-zinc-500">จำนวน:</label>
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="font-medium text-sm text-zinc-700 dark:text-zinc-300 min-w-[80px] text-right">
                          ฿{((Number(item.product?.price) || 0) * item.quantity).toLocaleString("th-TH")}
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(item.productId)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 sticky top-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">การตั้งค่าส่วนลด</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ประเภทส่วนลด <span className="text-rose-500">*</span></label>
                <Select value={formData.discountType} onValueChange={v => setFormData(f => ({ ...f, discountType: v as any }))}>
                  <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <SelectValue placeholder="เลือกประเภทส่วนลด" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <SelectItem value="percentage" className="py-2.5">ลดเป็นเปอร์เซ็นต์ (%)</SelectItem>
                    <SelectItem value="fixed_amount" className="py-2.5">ลดราคาคงที่ (บาท)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  มูลค่าส่วนลด <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    required 
                    type="number" 
                    step={formData.discountType === "percentage" ? "1" : "0.01"}
                    min="0"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    value={formData.discountValue} 
                    onChange={e => setFormData(f => ({ ...f, discountValue: e.target.value }))} 
                    className="w-full pl-4 pr-12 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" 
                    placeholder="0" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm">
                    {formData.discountType === "percentage" ? "%" : "฿"}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-500">ราคาสินค้ารวม (ปกติ)</span>
                  <span className="font-medium">
                    ฿{bundleItems.reduce((acc, item) => acc + (Number(item.product?.price) || 0) * item.quantity, 0).toLocaleString("th-TH")}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4 text-emerald-600 dark:text-emerald-400">
                  <span className="text-sm">ส่วนลดที่ได้รับ</span>
                  <span className="font-medium">
                    - {formData.discountType === "percentage" 
                      ? `${formData.discountValue || 0}%` 
                      : `฿${Number(formData.discountValue || 0).toLocaleString("th-TH")}`}
                  </span>
                </div>
                <div className="flex justify-between items-end p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="font-semibold text-zinc-900 dark:text-white">ราคาเซ็ตสุทธิ</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ฿{(() => {
                      const total = bundleItems.reduce((acc, item) => acc + (Number(item.product?.price) || 0) * item.quantity, 0);
                      const discount = Number(formData.discountValue) || 0;
                      if (formData.discountType === "percentage") {
                        return Math.max(0, total * (1 - discount / 100)).toLocaleString("th-TH", { maximumFractionDigits: 2 });
                      }
                      return Math.max(0, total - discount).toLocaleString("th-TH", { maximumFractionDigits: 2 });
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Link href="/dashboard/bundles" className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEdit ? "บันทึกการแก้ไข" : "สร้างเซ็ตสินค้า"}
          </button>
        </div>
      </form>
    </div>
  );
}
