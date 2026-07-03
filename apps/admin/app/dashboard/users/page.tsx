"use client";

import { useState } from "react";
import { Search, Filter, Plus, Users, UserCheck, UserPlus, ShieldAlert, MoreHorizontal, Edit2, Trash2, X } from "lucide-react";

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export default function ManageUsers() {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const users = [
    { id: 1, name: "Sarah Jenkins", email: "sarah.j@musicgear.com", role: "ADMIN", joinDate: "Oct 12, 2023", status: "Active" },
    { id: 2, name: "Marcus Chen", email: "m.chen@musicgear.com", role: "STAFF", joinDate: "Nov 05, 2023", status: "Active" },
    { id: 3, name: "Elena Rodriguez", email: "elena.r99@gmail.com", role: "CUSTOMER", joinDate: "Jan 15, 2024", status: "Inactive" },
    { id: 4, name: "David Kim", email: "dkim_rocks@yahoo.com", role: "CUSTOMER", joinDate: "Feb 02, 2024", status: "Active" },
  ];

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
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">12,458</h3>
            <p className="text-xs text-emerald-500 font-medium mt-1">+4.2% จากเดือนที่แล้ว</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">กำลังออนไลน์</span>
            <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">842</h3>
            <p className="text-xs text-muted-foreground mt-1">ใช้งานระบบในขณะนี้</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">สมัครใหม่ (7 วัน)</span>
            <div className="p-2 bg-blue-500/10 rounded-md text-blue-500">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">156</h3>
            <p className="text-xs text-muted-foreground mt-1">ผู้ใช้ใหม่ในสัปดาห์นี้</p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">รอการตรวจสอบ</span>
            <div className="p-2 bg-amber-500/10 rounded-md text-amber-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold">24</h3>
            <p className="text-xs text-amber-500 font-medium mt-1">ต้องการอนุมัติจากแอดมิน</p>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border-transparent rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            ทุกระดับสิทธิ์
          </button>
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50' : 
                      user.role === 'STAFF' ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50' : 
                      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.joinDate}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      {user.status === 'Active' ? 'ใช้งานปกติ' : 'ระงับการใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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
        <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
          <div>แสดงผล 1 ถึง 4 จาก 12,458 รายการ</div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50" disabled>ก่อนหน้า</button>
            <button className="px-3 py-1 border rounded bg-primary text-primary-foreground">1</button>
            <button className="px-3 py-1 border rounded hover:bg-muted">2</button>
            <button className="px-3 py-1 border rounded hover:bg-muted">3</button>
            <span className="px-2">...</span>
            <button className="px-3 py-1 border rounded hover:bg-muted">ถัดไป</button>
          </div>
        </div>
      </div>

      {/* Add User Modal Overlay */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-background border shadow-lg rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">เพิ่มผู้ใช้ใหม่ (Add User)</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ชื่อ - นามสกุล</label>
                <input type="text" className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary" placeholder="เช่น John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">อีเมล</label>
                <input type="email" className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ระดับสิทธิ์ (Role)</label>
                <select className="w-full px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background">
                  <option value="CUSTOMER">ลูกค้า (Customer)</option>
                  <option value="STAFF">พนักงาน (Staff)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
              <button onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
                ยกเลิก
              </button>
              <button onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
