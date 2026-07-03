import Link from "next/link";
import { LayoutDashboard, Users, FileBarChart } from "lucide-react";
import { LoginButton } from "../../components/login-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white dark:bg-zinc-900 flex flex-col">
        <div className="h-16 border-b flex items-center px-6">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">MUSICGEAR</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            ภาพรวมระบบ
          </Link>
          <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Users className="w-4 h-4" />
            จัดการผู้ใช้
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <FileBarChart className="w-4 h-4" />
            รายงานเชิงลึก
          </Link>
        </nav>
        <div className="p-4 border-t">
          <LoginButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-16 border-b bg-white dark:bg-zinc-900 flex items-center justify-between px-8">
          <h2 className="text-sm font-medium text-zinc-500">Admin Portal</h2>
        </div>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
