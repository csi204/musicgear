"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus, X, Loader2, AlertCircle, Check, HelpCircle } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { getProducts, getInventory, ProductRecord } from "@/lib/api";
import { getAccessToken, getApiBaseUrl } from "@/lib/auth";

type ProductStatus = "active" | "inactive" | "out_of_stock" | "discontinued";

interface DisplayProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  reserved: number;
  status: ProductStatus;
  description: string;
  skillLevel: string;
  images: any[];
}

const statusConfig: Record<ProductStatus, { label: string; badge: string; dot: string }> = {
  active: { label: "มีสินค้า", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  inactive: { label: "ปิดใช้งาน", badge: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800/40 dark:text-zinc-400", dot: "bg-zinc-400" },
  out_of_stock: { label: "สินค้าหมด", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  discontinued: { label: "ยกเลิกผลิต", badge: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800/40 dark:text-zinc-400", dot: "bg-zinc-400" },
};

// ─────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────
function ProductRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="pl-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-6" />
        </div>
      </TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell className="pr-6 text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-16 inline-block" /></TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────
// StockBar — reserved section is now grey
// ─────────────────────────────────────────────────────
function StockBar({ stock, reserved }: { stock: number; reserved: number }) {
  const max = Math.max(stock, 50);
  const availPct = Math.min((stock - reserved) / max, 1) * 100;
  const reservedPct = Math.min(reserved / max, 1) * 100;
  const isLow = stock - reserved <= 5 && stock > 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
        <div
          className={`h-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${availPct}%` }}
        />
        <div
          className="h-full bg-zinc-400/40 dark:bg-zinc-500/40"
          style={{ width: `${reservedPct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums ${isLow ? "text-amber-600 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200"}`}>
        {stock - reserved}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Add Product Modal
// ─────────────────────────────────────────────────────
interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
    categoryId: "",
    brandId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.price) {
      setError("กรุณากรอกข้อมูลที่จำเป็น: ชื่อสินค้า, SKU และราคา");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
      const token = getAccessToken();
      const res = await fetch(`${apiBase}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          price: Number(form.price),
          description: form.description || undefined,
          categoryId: form.categoryId || undefined,
          brandId: form.brandId || undefined,
          status: "active",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `ผิดพลาด ${res.status}: ${res.statusText}`);
      }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถเพิ่มสินค้าได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">เพิ่มสินค้าใหม่</h3>
            <p className="text-xs text-zinc-400 mt-0.5">กรอกข้อมูลสินค้าที่ต้องการเพิ่มในระบบ</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {[
            { key: "name", label: "ชื่อสินค้า *", placeholder: "เช่น Fender Player Stratocaster", type: "text" },
            { key: "sku", label: "รหัส SKU *", placeholder: "เช่น FEN-PLAY-STRAT-001", type: "text" },
            { key: "price", label: "ราคา (บาท) *", placeholder: "เช่น 32000", type: "number" },
            { key: "description", label: "คำอธิบาย", placeholder: "รายละเอียดสินค้า (ไม่บังคับ)", type: "text" },
            { key: "categoryId", label: "รหัสหมวดหมู่", placeholder: "UUID (ไม่บังคับ)", type: "text" },
            { key: "brandId", label: "รหัสแบรนด์", placeholder: "UUID (ไม่บังคับ)", type: "text" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              เพิ่มสินค้าสำเร็จ! กำลังโหลดข้อมูลใหม่...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || success}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DisplayProduct | null>(null);

  // Filters state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prodRes = await getProducts({ limit: 100 });
      const invRes = await getInventory();

      const invMap = new Map(invRes.inventories?.map((i) => [i.productId, i]) ?? []);
      const mapped: DisplayProduct[] = prodRes.products.map((p) => {
        const inv = invMap.get(p.productId);
        const stock = inv?.quantity ?? 0;
        const reserved = inv?.reservedQuantity ?? 0;
        let status: ProductStatus = p.status as ProductStatus;
        if (p.status === "active" && stock <= 0) status = "out_of_stock";
        return {
          id: p.productId,
          name: p.name,
          sku: p.sku,
          category: p.category?.name ?? "ทั่วไป",
          brand: p.brand?.name ?? "ไม่ระบุแบรนด์",
          price: p.price,
          stock,
          reserved,
          status,
          description: p.description ?? "ไม่มีคำอธิบายเพิ่มเติมสำหรับสินค้านี้",
          skillLevel: p.skillLevel ?? "ไม่ระบุระดับ",
          images: p.images ?? []
        };
      });
      setProducts(mapped);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลสินค้าได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Extract unique categories for dropdown filter
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filtered = products.filter(
    (p) => {
      const matchSearch = search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || p.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">รายการสินค้า</h2>
          <p className="text-zinc-500 text-sm mt-1">ดูสินค้าและสถานะสต็อก — การแก้ไขราคา/เพิ่มสินค้าต้องมีสิทธิ์ Admin</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสินค้า
        </button>
      </div>

      {/* Main table card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า, SKU, แบรนด์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm font-semibold ${
                showFilterPanel
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              กรองข้อมูล
            </button>
            <span className="text-xs text-zinc-400 ml-auto">{filtered.length} รายการ</span>
          </div>

          {/* Expanded Filter Panel */}
          {showFilterPanel && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {/* Category Filter */}
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5">หมวดหมู่</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="all">หมวดหมู่ทั้งหมด</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5">สถานะ</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="active">มีสินค้า</option>
                  <option value="out_of_stock">สินค้าหมด</option>
                  <option value="inactive">ปิดใช้งาน</option>
                  <option value="discontinued">ยกเลิกผลิต</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold pl-6 text-xs uppercase tracking-wider">สินค้า</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">หมวดหมู่</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">แบรนด์</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">ราคา</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">คงเหลือ</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">สถานะ</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right pr-6">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <ProductRowSkeleton key={idx} />
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-red-500 font-semibold">{error}</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400">ไม่พบสินค้าที่ตรงกับการค้นหา</TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const lowStock = p.status === "active" && (p.stock - p.reserved) <= 5 && p.stock > 0;
                const sc = statusConfig[p.status];
                return (
                  <TableRow key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">{p.brand.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{p.name}</div>
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">SKU: {p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-650 dark:text-zinc-300">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{p.brand}</TableCell>
                    <TableCell className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      ฿{p.price.toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <StockBar stock={p.stock} reserved={p.reserved} />
                      {lowStock && (
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-bold mt-0.5 block">⚠ สต็อกใกล้หมด</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-sm px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${lowStock ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lowStock ? "bg-amber-500" : sc.dot}`} />
                        {lowStock ? "สต็อกใกล้หมด" : sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-3 py-1.5 text-sm font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        ดูรายละเอียด
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={loadData} />
      )}

      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Product Detail Modal Component
// ─────────────────────────────────────────────────────
interface ProductDetailModalProps {
  product: DisplayProduct;
  onClose: () => void;
}

function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const statusLabels: Record<string, string> = {
    active: "เปิดใช้งาน / พร้อมขาย",
    inactive: "ปิดใช้งานชั่วคราว",
    discontinued: "ยกเลิกการผลิต",
    out_of_stock: "สินค้าหมดสต็อก",
  };

  const skillLabels: Record<string, string> = {
    beginner: "ผู้เริ่มต้น (Beginner)",
    intermediate: "ระดับกลาง (Intermediate)",
    advanced: "ระดับสูง (Advanced)",
    "ไม่ระบุระดับ": "ไม่ระบุระดับ",
  };

  const primaryImage = product.images?.find((img: any) => img.isPrimary)?.imageUrl ||
                       product.images?.[0]?.imageUrl ||
                       "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&auto=format&fit=crop&q=60";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold">รายละเอียดสินค้า</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{product.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Main Info with Image */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-32 h-32 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center shrink-0">
              <img src={primaryImage} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold leading-tight">{product.name}</h4>
              <p className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-505 dark:text-zinc-400 px-2 py-0.5 rounded w-fit">SKU: {product.sku}</p>
              <p className="text-2xl font-black text-amber-500">฿{product.price.toLocaleString("th-TH")}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-200 dark:border-zinc-800 py-4 text-sm">
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">หมวดหมู่</span>
              <span className="font-bold">{product.category}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">แบรนด์ / ยี่ห้อ</span>
              <span className="font-bold">{product.brand}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">สถานะ</span>
              <span className="font-bold">{statusLabels[product.status] || product.status}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">ระดับความยาก</span>
              <span className="font-bold">{skillLabels[product.skillLevel || ""] || product.skillLevel}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-sm">
            <span className="text-xs text-zinc-400 font-semibold block">คำอธิบายสินค้า</span>
            <p className="text-zinc-650 dark:text-zinc-350 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800/50">
              {product.description}
            </p>
          </div>

          {/* Stock Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">สต็อกรวม</span>
              <p className="text-xl font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">{product.stock}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">จองสินค้า</span>
              <p className="text-xl font-extrabold text-zinc-500 mt-1">{product.reserved}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">พร้อมส่ง</span>
              <p className="text-xl font-extrabold text-emerald-500 mt-1">{Math.max(0, product.stock - product.reserved)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
