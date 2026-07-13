"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Plus, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts, getInventory, getCategories, deleteProduct, type ProductRecord, type InventoryRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { CustomSelect } from "@/components/custom-select";
import { useDebounce } from "@/hooks/use-debounce";
import { ProductForm } from "./product-form";

interface DisplayProduct extends ProductRecord {
  stock: number;
  reserved: number;
}

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  active: { label: "มีสินค้า", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  inactive: { label: "ปิดใช้งาน", badge: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800/40 dark:text-zinc-400", dot: "bg-zinc-400" },
  out_of_stock: { label: "สินค้าหมด", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400", dot: "bg-rose-500" },
  discontinued: { label: "ยกเลิกผลิต", badge: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800/40 dark:text-zinc-400", dot: "bg-zinc-400" },
};

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
          className="h-full bg-zinc-400/40 dark:bg-zinc-550/40"
          style={{ width: `${reservedPct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums ${isLow ? "text-amber-650 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200"}`}>
        {stock - reserved}
      </span>
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-zinc-200 dark:border-zinc-800/60 last:border-0">
      <td className="pl-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </div>
        </div>
      </td>
      <td className="py-3"><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></td>
      <td className="py-3"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12" /></td>
      <td className="py-3"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-6" />
        </div>
      </td>
      <td className="py-3"><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></td>
      <td className="py-3"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-16 inline-block" /></td>
    </tr>
  );
}

export default function ManageProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchQuery = useDebounce(searchInput, 500);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [categories, setCategories] = useState<{ categoryId: string; name: string }[]>([]);

  // Modal state
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<DisplayProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProductsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        clearSession();
        router.push("/");
        return;
      }
      
      const query: any = { page: currentPage, limit: 10 };
      if (debouncedSearchQuery) query.search = debouncedSearchQuery;
      if (statusFilter && statusFilter !== "all") query.status = statusFilter;
      if (categoryFilter && categoryFilter !== "all") query.category = categoryFilter;

      const [prodRes, invRes] = await Promise.all([
        getProducts(query, token),
        getInventory(token).catch(() => ({ inventories: [] }))
      ]);

      const invMap = new Map(
        (invRes.inventories ?? []).map((i) => [i.productId, i])
      );

      const mergedProducts = (prodRes.products || []).map((p) => {
        const inv = invMap.get(p.productId);
        return {
          ...p,
          stock: inv?.quantity ?? 0,
          reserved: inv?.reservedQuantity ?? 0
        };
      });

      setProducts(mergedProducts);
      setPagination({
        page: (prodRes as any).page ?? 1,
        limit: (prodRes as any).limit ?? 10,
        total: (prodRes as any).total ?? 0,
        totalPages: (prodRes as any).totalPages ?? 1
      });
    } catch (err: any) {
      if (err.message.includes("401") || err.message.includes("403")) {
        clearSession();
        router.push("/");
      } else {
        setError(err.message ?? "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า");
      }
    } finally {
      setLoading(false);
    }
  }, [router, currentPage, debouncedSearchQuery, statusFilter, categoryFilter]);

  // Load categories once for filter dropdown
  useEffect(() => {
    const token = getAccessToken();
    getCategories(token || undefined).then((res) => {
      setCategories(res.categories ?? []);
    }).catch(() => {});
  }, []);

  // Fetch when dependencies change
  useEffect(() => {
    fetchProductsList();
  }, [debouncedSearchQuery, statusFilter, currentPage, fetchProductsList]);

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(productToDelete.productId);
    try {
      const token = getAccessToken() || undefined;
      await deleteProduct(productToDelete.productId, token);
      setProductToDelete(null);
      fetchProductsList(); // Refresh
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">จัดการสินค้า</h2>
          <p className="text-zinc-500 mt-2">เพิ่ม แก้ไข ลบ และจัดการข้อมูลสินค้าในคลัง</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 font-medium hover:scale-[1.02] active:scale-[0.98] w-fit"
        >
          <Plus className="w-5 h-5" />
          เพิ่มสินค้าใหม่
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า (ชื่อ, รายละเอียด)..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm font-semibold ${
                showFilterPanel
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              กรองข้อมูล
            </button>
            <span className="text-xs text-zinc-400 ml-auto">{pagination?.total || 0} รายการ</span>
          </div>

          {/* Expanded Filter Panel */}
          {showFilterPanel && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {/* Category Filter — first like staff */}
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5">หมวดหมู่</label>
                <CustomSelect
                  value={categoryFilter || "all"}
                  onChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setCurrentPage(1); }}
                  options={[
                    { value: "all", label: "หมวดหมู่ทั้งหมด" },
                    ...categories.map((cat) => ({ value: cat.categoryId, label: cat.name }))
                  ]}
                  triggerClassName="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-250 dark:border-zinc-700 text-xs py-2 px-3 h-9"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>
              {/* Status Filter */}
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1.5">สถานะ</label>
                <CustomSelect
                  value={statusFilter || "all"}
                  onChange={(v) => { setStatusFilter(v === "all" ? "" : v); setCurrentPage(1); }}
                  options={[
                    { value: "all", label: "สถานะทั้งหมด" },
                    { value: "active", label: "มีสินค้า" },
                    { value: "out_of_stock", label: "สินค้าหมด" },
                    { value: "inactive", label: "ปิดใช้งาน" },
                    { value: "discontinued", label: "ยกเลิกผลิต" }
                  ]}
                  triggerClassName="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-250 dark:border-zinc-700 text-xs py-2 px-3 h-9"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[900px] md:min-w-full">
            <thead className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="font-bold pl-6 py-4 text-zinc-500 dark:text-zinc-400">สินค้า</th>
                <th className="font-bold py-4 text-zinc-500 dark:text-zinc-400">หมวดหมู่</th>
                <th className="font-bold py-4 text-zinc-500 dark:text-zinc-400">แบรนด์</th>
                <th className="font-bold py-4 text-zinc-500 dark:text-zinc-400">ราคา</th>
                <th className="font-bold py-4 text-zinc-500 dark:text-zinc-400">คงเหลือ</th>
                <th className="font-bold py-4 text-zinc-500 dark:text-zinc-400">สถานะ</th>
                <th className="font-bold py-4 text-zinc-500 dark:text-zinc-400">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <ProductRowSkeleton key={i} />)
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-16 text-rose-500 font-medium">⚠ {error}</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-zinc-500">ไม่พบสินค้าที่ตรงกับเงื่อนไข</td></tr>
              ) : products.map((product) => {
                const lowStock = product.status === "active" && (product.stock - product.reserved) <= 5 && product.stock > 0;
                const sc = statusConfig[product.status] || statusConfig.inactive;
                
                return (
                  <tr key={product.productId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                    <td className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">{(product.brand?.name || "NA").slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm max-w-[200px] truncate" title={product.name}>{product.name}</div>
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-650 dark:text-zinc-300">
                        {product.category?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      {product.brand?.name || '-'}
                    </td>
                    <td className="py-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      ฿{Number(product.price).toLocaleString("th-TH")}
                    </td>
                    <td className="py-3">
                      <StockBar stock={product.stock} reserved={product.reserved} />
                      {lowStock && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 block">⚠ สต็อกใกล้หมด</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-bold", lowStock ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : sc?.badge)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", lowStock ? "bg-amber-500" : sc?.dot)} />
                        {lowStock ? "สต็อกใกล้หมด" : sc?.label}
                      </div>
                    </td>
                    <td className="pr-6 py-3">
                      <div className="flex items-center justify-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setProductToEdit(product)}
                          className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1f1f22]">
          <div className="text-sm text-zinc-500 font-medium">
            แสดง {Math.min((currentPage - 1) * (pagination?.limit || 10) + 1, pagination?.total || 0)} - {Math.min(currentPage * (pagination?.limit || 10), pagination?.total || 0)} จาก {(pagination?.total || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 disabled:hover:bg-transparent shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all shadow-sm border",
                      currentPage === page 
                        ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                  >{page}</button>
                );
              })}
            </div>
            {(pagination?.totalPages || 1) > 5 && <span className="px-2 text-zinc-400">...</span>}
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination?.totalPages || 1, p + 1))}
              disabled={currentPage >= (pagination?.totalPages || 1)}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 disabled:hover:bg-transparent shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ยืนยันการลบสินค้า</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              คุณต้องการลบ <span className="font-bold text-zinc-900 dark:text-zinc-200">{productToDelete.name}</span> ใช่หรือไม่? <br/>
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={isDeleting !== null}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-all font-medium flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <ProductForm
          isModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchProductsList();
          }}
        />
      )}

      {/* Edit Modal */}
      {productToEdit && (
        <ProductForm 
          initialData={productToEdit} 
          isEdit 
          isModal 
          onClose={() => setProductToEdit(null)} 
          onSuccess={() => {
            setProductToEdit(null);
            fetchProductsList();
          }}
        />
      )}
    </div>
  );
}
