"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, Package, Archive, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { getProducts, deleteProduct, type ProductRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import Link from "next/link";
import Image from "next/image";

const STATUS_LABELS: Record<string, string> = { active: "พร้อมขาย", inactive: "ซ่อน", discontinued: "เลิกผลิต", out_of_stock: "ของหมด" };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  inactive: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  discontinued: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30",
  out_of_stock: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
};

export default function ManageProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      if (searchQuery) query.search = searchQuery;
      if (statusFilter && statusFilter !== "all") query.status = statusFilter;

      const res = await getProducts(query, token);
      setProducts(res.products);
      setPagination(res.pagination);
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
  }, [router, currentPage, searchQuery, statusFilter]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProductsList();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter, currentPage, fetchProductsList]);

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

  const getPrimaryImage = (product: ProductRecord) => {
    return product.images?.find(img => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || "";
  };

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">จัดการสินค้า</h2>
          <p className="text-zinc-500 mt-2">เพิ่ม แก้ไข ลบ และจัดการข้อมูลสินค้าในคลัง</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 font-medium hover:scale-[1.02] active:scale-[0.98] w-fit"
        >
          <Plus className="w-5 h-5" />
          เพิ่มสินค้าใหม่
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px] sm:w-[220px] h-11 pl-10 pr-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                  <SelectItem value="all" className="cursor-pointer py-2.5">ทุกสถานะ</SelectItem>
                  <SelectItem value="active" className="cursor-pointer py-2.5">พร้อมขาย (Active)</SelectItem>
                  <SelectItem value="inactive" className="cursor-pointer py-2.5">ซ่อน (Inactive)</SelectItem>
                  <SelectItem value="out_of_stock" className="cursor-pointer py-2.5">ของหมด (Out of Stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">รูปภาพ</th>
                <th className="px-6 py-4">ชื่อสินค้า / SKU</th>
                <th className="px-6 py-4">หมวดหมู่ & แบรนด์</th>
                <th className="px-6 py-4 text-right">ราคา</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />กำลังโหลดข้อมูล...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="text-center py-16 text-rose-500 font-medium">⚠ {error}</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-zinc-500">ไม่พบสินค้าที่ตรงกับเงื่อนไข</td></tr>
              ) : products.map((product) => (
                <tr key={product.productId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 flex items-center justify-center">
                      {getPrimaryImage(product) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getPrimaryImage(product)} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 dark:text-white max-w-[200px] truncate" title={product.name}>{product.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5 font-mono">{product.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900 dark:text-white text-sm">{product.category?.name || '-'}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{product.brand?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-medium text-zinc-900 dark:text-white">
                      ฿{Number(product.price).toLocaleString("th-TH")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border", STATUS_COLORS[product.status] || STATUS_COLORS.inactive)}>
                      {STATUS_LABELS[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/dashboard/products/${product.productId}`}
                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
          <div className="text-sm text-zinc-500 font-medium">
            แสดง {Math.min((currentPage - 1) * (pagination?.limit || 10) + 1, pagination?.total || 0)} - {Math.min(currentPage * (pagination?.limit || 10), pagination?.total || 0)} จาก {(pagination?.total || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 disabled:hover:bg-transparent shadow-sm transition-all"
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
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 disabled:hover:bg-transparent shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center p-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ยืนยันการลบสินค้า?</h3>
            <p className="text-zinc-500 text-sm mb-6">คุณกำลังจะลบสินค้า <span className="font-semibold text-zinc-700 dark:text-zinc-300">{productToDelete.name}</span> ออกจากระบบ การกระทำนี้ไม่สามารถยกเลิกได้</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setProductToDelete(null)} className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm w-full">ยกเลิก</button>
              <button
                onClick={confirmDeleteProduct}
                disabled={isDeleting !== null}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2 w-full"
              >
                {isDeleting !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
