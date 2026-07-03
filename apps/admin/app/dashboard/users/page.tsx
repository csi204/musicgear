"use client";


import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, Users, UserCheck, UserPlus, ShieldAlert, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { getUsers, createUser, deleteUser, type UserRecord, type UserListQuery } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = { admin: "ผู้ดูแลระบบ", staff: "พนักงาน", customer: "ลูกค้า" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50",
  staff: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50",
  customer: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
};

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [addUserForm, setAddUserForm] = useState({ firstName: "", lastName: "", email: "", role: "customer" as const });
  const [addUserLoading, setAddUserLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        clearSession();
        router.push("/");
        return;
      }
      const query: UserListQuery = {
        page: currentPage,
        limit: 10,
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter && { role: roleFilter as any }),
      };
      const res = await getUsers(query, token);
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err: any) {
      if (err.message.includes("401") || err.message.includes("403")) {
        clearSession();
        router.push("/");
      } else {
        setError(err.message ?? "เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, router]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleAddUser = async () => {
    setAddUserLoading(true);
    try {
      const token = getAccessToken() || undefined;
      await createUser(addUserForm, token);
      setIsAddUserModalOpen(false);
      setAddUserForm({ firstName: "", lastName: "", email: "", role: "customer" });
      fetchUsers();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("ต้องการลบผู้ใช้นี้ออกจากระบบหรือไม่?")) return;
    setIsDeleting(userId);
    try {
      const token = getAccessToken() || undefined;
      await deleteUser(userId, token);
      fetchUsers();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">จัดการผู้ใช้งาน</h2>
          <p className="text-muted-foreground mt-1">จัดการบัญชีผู้ใช้, กำหนดสิทธิ์ และเข้าถึงระบบ</p>
        </div>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">ผู้ใช้งานทั้งหมด</span>
            <div className="p-2 bg-primary/10 rounded-md text-primary"><Users className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">{pagination.total.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-1">ในระบบทั้งหมด</p>
          </div>
        </div>
        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">ลูกค้า</span>
            <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500"><UserCheck className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">{users.filter(u => u.role === "customer").length}</h3>
            <p className="text-xs text-muted-foreground mt-1">ในหน้านี้</p>
          </div>
        </div>
        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">พนักงาน</span>
            <div className="p-2 bg-blue-500/10 rounded-md text-blue-500"><UserPlus className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">{users.filter(u => u.role === "staff").length}</h3>
            <p className="text-xs text-muted-foreground mt-1">ในหน้านี้</p>
          </div>
        </div>
        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">ผู้ดูแลระบบ</span>
            <div className="p-2 bg-amber-500/10 rounded-md text-amber-500"><ShieldAlert className="w-4 h-4" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">{users.filter(u => u.role === "admin").length}</h3>
            <p className="text-xs text-muted-foreground mt-1">ในหน้านี้</p>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-background p-4 rounded-xl border shadow-sm">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ อีเมล..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border-transparent rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors bg-background outline-none"
          >
            <option value="">ทุกระดับสิทธิ์</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="staff">พนักงาน</option>
            <option value="customer">ลูกค้า</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-background border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">ผู้ใช้งาน</th>
                <th className="px-6 py-4">ระดับสิทธิ์</th>
                <th className="px-6 py-4">วันที่สมัคร</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />กำลังโหลดข้อมูล...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center py-12 text-red-500">⚠ {error}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">ไม่พบผู้ใช้งาน</td></tr>
              ) : users.map((user) => (
                <tr key={user.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        {user.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("th-TH")}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      {user.status === "active" ? "ใช้งานปกติ" : "ระงับการใช้งาน"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        disabled={isDeleting === user.userId}
                        onClick={() => handleDeleteUser(user.userId)}
                        className="p-2 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                      >
                        {isDeleting === user.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
          <div>แสดงผล {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} ถึง {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total.toLocaleString()} รายการ</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50"
            >ก่อนหน้า</button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded ${currentPage === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >{page}</button>
              );
            })}
            {pagination.totalPages > 5 && <span className="px-2">...</span>}
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50"
            >ถัดไป</button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-background border shadow-lg rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">เพิ่มผู้ใช้ใหม่</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ชื่อ</label>
                  <input type="text" value={addUserForm.firstName} onChange={e => setAddUserForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary" placeholder="ชื่อจริง" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">นามสกุล</label>
                  <input type="text" value={addUserForm.lastName} onChange={e => setAddUserForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary" placeholder="นามสกุล" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">อีเมล</label>
                <input type="email" value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ระดับสิทธิ์</label>
                <select value={addUserForm.role} onChange={e => setAddUserForm(f => ({ ...f, role: e.target.value as any }))} className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary bg-background">
                  <option value="customer">ลูกค้า (Customer)</option>
                  <option value="staff">พนักงาน (Staff)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
              <button onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">ยกเลิก</button>
              <button
                onClick={handleAddUser}
                disabled={addUserLoading || !addUserForm.email || !addUserForm.firstName}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {addUserLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
