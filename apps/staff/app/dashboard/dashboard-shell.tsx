"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out h-full shrink-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} setMobileOpen={setMobileOpen} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative w-full">
        {/* Header bar (both Mobile and Desktop) */}
        <header className="print:hidden flex items-center justify-between px-6 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer md:hidden rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Collapse Button */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            
            <span className="font-bold text-zinc-900 dark:text-white text-sm">MusicGear Staff</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
