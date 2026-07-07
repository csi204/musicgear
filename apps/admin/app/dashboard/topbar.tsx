"use client";

import { Bell, Menu } from "lucide-react";

export function TopBar() {
  return (
    <header className="print:hidden h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <label htmlFor="mobile-sidebar-toggle" className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer md:hidden">
          <Menu className="w-6 h-6" />
        </label>
        {/* We can put page-specific titles here or leave it empty/flexible */}
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors relative group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-zinc-950"></span>
        </button>
        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] shadow-sm">
            <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden border border-white dark:border-zinc-900">
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
