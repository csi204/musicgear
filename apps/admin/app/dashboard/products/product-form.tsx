"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getBrands, getCategories, createProduct, updateProduct, type ProductRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { ChevronLeft, Save, Loader2, Image as ImageIcon, X, Upload, Edit2 } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";

interface ProductFormProps {
  initialData?: ProductRecord;
  isEdit?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export function ProductForm({ initialData, isEdit = false, isModal = false, onClose, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ brandId: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ categoryId: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    price: initialData?.price || "",
    originalPrice: initialData?.originalPrice || "",
    brandId: initialData?.brand?.brandId || "",
    categoryId: initialData?.category?.categoryId || "",
    skillLevel: initialData?.skillLevel || "",
    status: initialData?.status || "active",
    description: initialData?.description || "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const [brandsRes, catRes] = await Promise.all([
          getBrands(token),
          getCategories(token)
        ]);
        setBrands(brandsRes.brands);
        setCategories(catRes.categories);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    };
    fetchDropdowns();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        alert(`ไฟล์ ${f.name} ไม่รองรับ อนุญาตเฉพาะ JPG และ PNG`);
        return false;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        alert(`ไฟล์ ${f.name} ขนาดเกิน 10MB`);
        return false;
      }
      return true;
    });
    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.imageId !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.price || !formData.brandId || !formData.categoryId) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
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

      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("sku", formData.sku);
      fd.append("price", formData.price.toString());
      if (formData.originalPrice) fd.append("originalPrice", formData.originalPrice.toString());
      fd.append("brandId", formData.brandId);
      fd.append("categoryId", formData.categoryId);
      if (formData.skillLevel) fd.append("skillLevel", formData.skillLevel);
      fd.append("status", formData.status);
      if (formData.description) fd.append("description", formData.description);

      // Keep existing images IDs if editing (Backend might need logic to retain these, but currently the backend just replaces them if we send files, actually the backend appends them unless we tell it to delete. For now, we will just send new images).
      images.forEach(file => {
        fd.append("images", file);
      });

      if (isEdit && initialData) {
        await updateProduct(initialData.productId, fd, token);
      } else {
        await createProduct(fd, token);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/products");
      }
    } catch (err: any) {
      setError(err.message ?? "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <>
      <div className={isModal ? "flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800" : "flex items-center gap-4 mb-8"}>
        <div className="flex items-center gap-4">
          {!isModal && (
            <Link href="/dashboard/products" className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-zinc-500" />
            </Link>
          )}
          {isModal && (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className={isModal ? "text-xl font-bold tracking-tight text-zinc-900 dark:text-white" : "text-3xl font-bold tracking-tight text-zinc-900 dark:text-white"}>
              {isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
            </h2>
            {!isModal && <p className="text-zinc-500 mt-1">{isEdit ? "แก้ไขข้อมูลของสินค้าเดิมในคลัง" : "เพิ่มรายการสินค้าใหม่ลงในคลัง"}</p>}
          </div>
        </div>
        {isModal && (
          <button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-3 text-sm flex items-center justify-between mb-6">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={isModal ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
          <div className={isModal ? "space-y-6" : "lg:col-span-2 space-y-6"}>
            <div className={isModal ? "space-y-6" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6"}>
              <h3 className={isModal ? "text-lg font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-800" : "text-lg font-bold text-zinc-900 dark:text-white"}>ข้อมูลพื้นฐาน</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ชื่อสินค้า <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="เช่น Fender Stratocaster" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">รายละเอียดสินค้า</label>
                <textarea rows={5} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none" placeholder="รายละเอียด..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">หมวดหมู่ <span className="text-rose-500">*</span></label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData(f => ({ ...f, categoryId: v }))}>
                    <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                      {categories.map(c => <SelectItem key={c.categoryId} value={c.categoryId} className="py-2.5">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">แบรนด์ <span className="text-rose-500">*</span></label>
                  <Select value={formData.brandId} onValueChange={v => setFormData(f => ({ ...f, brandId: v }))}>
                    <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                      <SelectValue placeholder="เลือกแบรนด์" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                      {brands.map(b => <SelectItem key={b.brandId} value={b.brandId} className="py-2.5">{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className={isModal ? "space-y-6 pt-2" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6"}>
              <h3 className={isModal ? "text-lg font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-800" : "text-lg font-bold text-zinc-900 dark:text-white"}>รูปภาพสินค้า (JPG, PNG ไม่เกิน 10MB)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {existingImages.map((img) => (
                  <div key={img.imageId} className="relative aspect-square rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(img.imageId)} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                    {img.isPrimary && <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ภาพหลัก</div>}
                  </div>
                ))}
                {images.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors group">
                  <Upload className="w-6 h-6 mb-2 text-zinc-400 group-hover:text-blue-500" />
                  <span className="text-xs font-medium">อัปโหลดภาพ</span>
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg, image/png" className="hidden" onChange={handleImageSelect} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={isModal ? "space-y-6" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6"}>
              <h3 className={isModal ? "text-lg font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-200 dark:border-zinc-800" : "text-lg font-bold text-zinc-900 dark:text-white"}>ราคาและสถานะ</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">รหัส SKU <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.sku} onChange={e => setFormData(f => ({ ...f, sku: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono uppercase" placeholder="เช่น FND-STR-001" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ราคาขาย (บาท) <span className="text-rose-500">*</span></label>
                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="0.00" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ราคาเดิม (ก่อนลด)</label>
                <input type="number" step="0.01" value={formData.originalPrice} onChange={e => setFormData(f => ({ ...f, originalPrice: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-zinc-500" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ระดับผู้เล่น</label>
                <Select value={formData.skillLevel || "all"} onValueChange={v => setFormData(f => ({ ...f, skillLevel: v === "all" ? "" : v }))}>
                  <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <SelectValue placeholder="เลือกระดับ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <SelectItem value="all" className="py-2.5 text-zinc-500">ไม่ระบุ</SelectItem>
                    <SelectItem value="beginner" className="py-2.5">ผู้เริ่มต้น (Beginner)</SelectItem>
                    <SelectItem value="intermediate" className="py-2.5">ระดับกลาง (Intermediate)</SelectItem>
                    <SelectItem value="advanced" className="py-2.5">มืออาชีพ (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">สถานะสินค้า</label>
                <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <SelectItem value="active" className="py-2.5">พร้อมขาย (Active)</SelectItem>
                    <SelectItem value="inactive" className="py-2.5">ซ่อน (Inactive)</SelectItem>
                    <SelectItem value="out_of_stock" className="py-2.5 text-rose-500">ของหมด (Out of Stock)</SelectItem>
                    <SelectItem value="discontinued" className="py-2.5 text-slate-500">เลิกผลิต (Discontinued)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className={isModal ? "flex justify-end gap-3 px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 -mx-6 -mb-6 mt-6 rounded-b-3xl" : "flex justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-8"}>
          {isModal ? (
            <button type="button" onClick={onClose} className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
              ยกเลิก
            </button>
          ) : (
            <Link href="/dashboard/products" className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
              ยกเลิก
            </Link>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEdit ? "บันทึกการแก้ไข" : "บันทึกสินค้าใหม่"}
          </button>
        </div>
      </form>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#111113] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
          <div className="p-6 overflow-y-auto">
            {FormContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      {FormContent}
    </div>
  );
}
