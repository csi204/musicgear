"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Layers, Edit2, Trash2, X, Loader2, Package } from "lucide-react";
import { getBundles, deleteBundle, type BundleRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

export default function ManageBundles() {
  const router = useRouter();
  const [bundles, setBundles] = useState<BundleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [bundleToDelete, setBundleToDelete] = useState<BundleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchBundlesList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        clearSession();
        router.push("/");
        return;
      }
      
      const res = await getBundles(token);
      setBundles(res.bundles);
    } catch (err: any) {
      if (err.message.includes("401") || err.message.includes("403")) {
        clearSession();
        router.push("/");
      } else {
        setError(err.message ?? "เกิดข้อผิดพลาดในการดึงข้อมูลเซ็ตสินค้า");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBundlesList();
  }, [fetchBundlesList]);

  const confirmDeleteBundle = async () => {
    if (!bundleToDelete) return;
    setIsDeleting(bundleToDelete.bundleId);
    try {
      const token = getAccessToken() || undefined;
      await deleteBundle(bundleToDelete.bundleId, token);
      setBundleToDelete(null);
      fetchBundlesList(); // Refresh
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredBundles = bundles.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">จัดการเซ็ตสินค้า (Bundles)</h2>
          <p className="text-zinc-500 mt-2">เพิ่ม แก้ไข ลบ และจัดการการจัดเซ็ตสินค้า</p>
        </div>
        <Link
          href="/dashboard/bundles/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 font-medium hover:scale-[1.02] active:scale-[0.98] w-fit"
        >
          <Plus className="w-5 h-5" />
          สร้างเซ็ตสินค้าใหม่
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเซ็ตสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Bundle Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">ชื่อเซ็ตสินค้า</th>
                <th className="px-6 py-4">รายละเอียด</th>
                <th className="px-6 py-4">ส่วนลดที่ตั้งไว้</th>
                <th className="px-6 py-4">จำนวนสินค้าในเซ็ต</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16 text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />กำลังโหลดข้อมูล...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center py-16 text-rose-500 font-medium">⚠ {error}</td></tr>
              ) : filteredBundles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-zinc-500">ไม่พบเซ็ตสินค้าที่ตรงกับเงื่อนไข</td></tr>
              ) : filteredBundles.map((bundle) => {
                const discountText = bundle.discountType === "percentage" 
                  ? `ลด ${bundle.discountValue}%` 
                  : `ลด ฿${Number(bundle.discountValue).toLocaleString("th-TH")}`;
                  
                return (
                  <tr key={bundle.bundleId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-zinc-900 dark:text-white">{bundle.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-500 text-xs line-clamp-2 max-w-xs">{bundle.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {discountText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-zinc-400" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{bundle.items.length} รายการ</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/dashboard/bundles/${bundle.bundleId}`}
                          className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setBundleToDelete(bundle)}
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
      </div>

      {/* Delete Confirmation Modal */}
      {bundleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center p-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ยืนยันการลบเซ็ตสินค้า?</h3>
            <p className="text-zinc-500 text-sm mb-6">คุณกำลังจะลบเซ็ตสินค้า <span className="font-semibold text-zinc-700 dark:text-zinc-300">{bundleToDelete.name}</span> ออกจากระบบ การกระทำนี้ไม่สามารถยกเลิกได้</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setBundleToDelete(null)} className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm w-full">ยกเลิก</button>
              <button
                onClick={confirmDeleteBundle}
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
