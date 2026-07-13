"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, Users, UserCheck, UserPlus, ShieldAlert, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, type UserRecord, type UserListQuery } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { useDebounce } from "@/hooks/use-debounce";

const ROLE_LABELS: Record<string, string> = { admin: "ผู้ดูแลระบบ", staff: "พนักงาน", customer: "ลูกค้า" };
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
  staff: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  customer: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30",
};

let CACHED_USERS: UserRecord[] | null = null;
let CACHED_TIMESTAMP = 0;
const CACHE_TTL = 30000; // 30 seconds cache for instant tab switching

export default function ManageUsers() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserRecord[]>(CACHED_USERS || []);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(!CACHED_USERS);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [addUserForm, setAddUserForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "customer" as const });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New Modal States
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ userId: "", firstName: "", lastName: "", email: "", role: "customer" as any, password: "" });
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const fetchUsers = useCallback(async (force = false) => {
    if (!force && CACHED_USERS && (Date.now() - CACHED_TIMESTAMP < CACHE_TTL)) {
      setAllUsers(CACHED_USERS);
      setLoading(false);
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
      // Fetch all users once
      const res = await getUsers({ limit: 100, page: 1 }, token);
      CACHED_USERS = res.users;
      CACHED_TIMESTAMP = Date.now();
      setAllUsers(res.users);
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
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side filtering
  const filteredUsers = allUsers.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      if (!u.firstName.toLowerCase().includes(q) &&
          !u.lastName.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.ceil(totalFiltered / pagination.limit) || 1;
  const users = filteredUsers.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit);

  const handleAddUser = async () => {
    setAddUserLoading(true);
    try {
      const token = getAccessToken() || undefined;
      await createUser(addUserForm, token);
      setIsAddUserModalOpen(false);
      setAddUserForm({ firstName: "", lastName: "", email: "", password: "", role: "customer" as const });
      fetchUsers(true);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setAddUserLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(userToDelete.userId);
    try {
      const token = getAccessToken() || undefined;
      await deleteUser(userToDelete.userId, token);
      setUserToDelete(null);
      fetchUsers(true);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditUserSubmit = async () => {
    setEditUserLoading(true);
    try {
      const token = getAccessToken() || undefined;
      const data: any = { firstName: editUserForm.firstName, lastName: editUserForm.lastName, email: editUserForm.email, role: editUserForm.role };
      if (editUserForm.password) data.password = editUserForm.password;
      await updateUser(editUserForm.userId, data, token);
      setIsEditUserModalOpen(false);
      fetchUsers(true);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setEditUserLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">จัดการผู้ใช้งาน</h2>
          <p className="text-zinc-500 mt-2">เพิ่ม ลบ แก้ไข และจัดการสิทธิ์การเข้าถึงของผู้ใช้ทั้งหมดในระบบ</p>
        </div>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 font-medium hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ผู้ใช้งานทั้งหมด</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400"><Users className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{allUsers.length.toLocaleString()}</h3>
            <p className="text-xs text-zinc-500 mt-2">บัญชีทั้งหมดในระบบ</p>
          </div>
        </div>
        
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ลูกค้า</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400"><UserCheck className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{allUsers.filter(u => u.role === "customer").length.toLocaleString()}</h3>
            <p className="text-xs text-zinc-500 mt-2">ทั้งหมดในระบบ</p>
          </div>
        </div>
        
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">พนักงาน</span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400"><UserPlus className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{allUsers.filter(u => u.role === "staff").length.toLocaleString()}</h3>
            <p className="text-xs text-zinc-500 mt-2">ทั้งหมดในระบบ</p>
          </div>
        </div>
        
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ผู้ดูแลระบบ</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400"><ShieldAlert className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{allUsers.filter(u => u.role === "admin").length.toLocaleString()}</h3>
            <p className="text-xs text-zinc-500 mt-2">ทั้งหมดในระบบ</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ อีเมล..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Select value={roleFilter || "all"} onValueChange={(v) => { setRoleFilter(v === "all" ? "" : v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px] sm:w-[220px] h-11 pl-10 pr-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <SelectValue placeholder="ทุกระดับสิทธิ์" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                  <SelectItem value="all" className="cursor-pointer py-2.5">ทุกระดับสิทธิ์</SelectItem>
                  <SelectItem value="admin" className="cursor-pointer py-2.5">ผู้ดูแลระบบ (Admin)</SelectItem>
                  <SelectItem value="staff" className="cursor-pointer py-2.5">พนักงาน (Staff)</SelectItem>
                  <SelectItem value="customer" className="cursor-pointer py-2.5">ลูกค้า (Customer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">ผู้ใช้งาน</th>
                <th className="px-6 py-4">ระดับสิทธิ์</th>
                <th className="px-6 py-4">วันที่สมัคร</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16 text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />กำลังโหลดข้อมูล...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center py-16 text-rose-500 font-medium">⚠ {error}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-zinc-500">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</td></tr>
              ) : users.map((user) => (
                <tr key={user.userId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-blue-500/10">
                        {user.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.firstName} {user.lastName}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border", ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-medium text-xs">{new Date(user.createdAt).toLocaleDateString("th-TH", { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shadow-sm", user.status === "active" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-zinc-300 dark:bg-zinc-600")} />
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{user.status === "active" ? "ใช้งานปกติ" : "ระงับการใช้งาน"}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditUserForm({ userId: user.userId, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, password: "" });
                          setIsEditUserModalOpen(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUserToDelete(user)}
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
            แสดง {Math.min((currentPage - 1) * pagination.limit + 1, totalFiltered)} - {Math.min(currentPage * pagination.limit, totalFiltered)} จาก {totalFiltered.toLocaleString()}
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
            {totalPages > 5 && <span className="px-2 text-zinc-400">...</span>}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-50 disabled:hover:bg-transparent shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">เพิ่มผู้ใช้ใหม่</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ชื่อ</label>
                  <input type="text" value={addUserForm.firstName} onChange={e => setAddUserForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="ชื่อจริง" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">นามสกุล</label>
                  <input type="text" value={addUserForm.lastName} onChange={e => setAddUserForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="นามสกุล" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">อีเมล</label>
                <input type="email" value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">รหัสผ่านชั่วคราว (ทิ้งว่างได้)</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))} className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="หากระบุ ผู้ใช้จะต้องเปลี่ยนรหัสผ่านใหม่เมื่อเข้าสู่ระบบ" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ระดับสิทธิ์</label>
                <Select value={addUserForm.role} onValueChange={v => setAddUserForm(f => ({ ...f, role: v as any }))}>
                  <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <SelectValue placeholder="เลือกระดับสิทธิ์" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <SelectItem value="customer" className="cursor-pointer py-2.5">ลูกค้า (Customer)</SelectItem>
                    <SelectItem value="staff" className="cursor-pointer py-2.5">พนักงาน (Staff)</SelectItem>
                    <SelectItem value="admin" className="cursor-pointer py-2.5">ผู้ดูแลระบบ (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button onClick={() => setIsAddUserModalOpen(false)} className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">ยกเลิก</button>
              <button
                onClick={handleAddUser}
                disabled={addUserLoading || !addUserForm.email || !addUserForm.firstName}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {addUserLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Edit2 className="w-5 h-5" /></div>
                <div><h3 className="text-xl font-bold text-zinc-900 dark:text-white">แก้ไขข้อมูลผู้ใช้</h3></div>
              </div>
              <button onClick={() => setIsEditUserModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ชื่อ</label>
                  <input type="text" value={editUserForm.firstName} onChange={e => setEditUserForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">นามสกุล</label>
                  <input type="text" value={editUserForm.lastName} onChange={e => setEditUserForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">อีเมล</label>
                <input type="email" value={editUserForm.email} onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ตั้งรหัสผ่านใหม่ (ทิ้งว่างได้หากไม่ต้องการเปลี่ยน)</label>
                <div className="relative">
                  <input type={showEditPassword ? "text" : "password"} value={editUserForm.password} onChange={e => setEditUserForm(f => ({ ...f, password: e.target.value }))} className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="กรอกรหัสผ่านใหม่เพื่อเปลี่ยน" />
                  <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ระดับสิทธิ์</label>
                <Select value={editUserForm.role} onValueChange={v => setEditUserForm(f => ({ ...f, role: v as any }))}>
                  <SelectTrigger className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <SelectValue placeholder="เลือกระดับสิทธิ์" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <SelectItem value="customer" className="cursor-pointer py-2.5">ลูกค้า (Customer)</SelectItem>
                    <SelectItem value="staff" className="cursor-pointer py-2.5">พนักงาน (Staff)</SelectItem>
                    <SelectItem value="admin" className="cursor-pointer py-2.5">ผู้ดูแลระบบ (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button onClick={() => setIsEditUserModalOpen(false)} className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">ยกเลิก</button>
              <button
                onClick={handleEditUserSubmit}
                disabled={editUserLoading || !editUserForm.firstName}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {editUserLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center p-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ยืนยันการลบผู้ใช้?</h3>
            <p className="text-zinc-500 text-sm mb-6">คุณกำลังจะลบผู้ใช้ <span className="font-semibold text-zinc-700 dark:text-zinc-300">{userToDelete.firstName} {userToDelete.lastName}</span> ออกจากระบบ การกระทำนี้ไม่สามารถยกเลิกได้</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setUserToDelete(null)} className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm w-full">ยกเลิก</button>
              <button
                onClick={confirmDeleteUser}
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
