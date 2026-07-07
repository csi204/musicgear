"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, Menu, ClipboardList } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { LoginButton } from "./login-button";
import { useState, useEffect } from "react";
import { cn } from "@workspace/ui/lib/utils";

import { useCart } from "../hooks/useCart";
import { CartDrawer } from "./cart-drawer";

export function Navbar() {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };
    window.addEventListener("mg_open_cart", handleOpenCart);
    return () => window.removeEventListener("mg_open_cart", handleOpenCart);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white bg-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6">
        
        {/* Left Side: Logo & Navigation Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="MusicGear Logo"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-neutral-900 transition-colors duration-200 hover:text-neutral-950"
            >
              หน้าแรก
            </Link>
            <Link
              href="/products?category=guitars"
              className="text-sm font-medium text-slate-gray transition-colors duration-200 hover:text-neutral-900"
            >
              กีต้าร์
            </Link>
            <Link
              href="/products?category=keyboards"
              className="text-sm font-medium text-slate-gray transition-colors duration-200 hover:text-neutral-900"
            >
              คีย์บอร์ด
            </Link>
            <Link
              href="/products?category=drums"
              className="text-sm font-medium text-slate-gray transition-colors duration-200 hover:text-neutral-900"
            >
              กลอง
            </Link>
            <Link
              href="/products?category=pro-audio"
              className="text-sm font-medium text-slate-gray transition-colors duration-200 hover:text-neutral-900"
            >
              เครื่องเสียงโปร
            </Link>
            <Link
              href="/brands"
              className="text-sm font-medium text-slate-gray transition-colors duration-200 hover:text-neutral-900"
            >
              แบรนด์
            </Link>
          </nav>
        </div>

        {/* Right Side: Search, Auth, and Cart */}
        <div className="flex items-center gap-6">
          {/* Search Input */}
          <div className="relative hidden lg:block w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-gray" />
            <input
              type="text"
              placeholder="ค้นหาเครื่องดนตรี..."
              className="h-10 w-full rounded-full border border-[#DEDCD4] bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder-slate-gray outline-none transition-all duration-200 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* User Auth Buttons / Menu */}
          <div className="hidden sm:block">
            <LoginButton />
          </div>

          {/* My Orders Link */}
          <Link
            href="/orders"
            className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-[#DEDCD4] bg-white text-neutral-800 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-300"
            title="ประวัติการสั่งซื้อ"
          >
            <ClipboardList className="h-5 w-5" />
          </Link>

          {/* Cart Icon Button (Triggers Drawer) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#DEDCD4] bg-white text-neutral-800 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-warm-offwhite animate-scale-in">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DEDCD4] bg-white text-neutral-800 md:hidden hover:bg-neutral-50"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Basic Toggle) */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E5E2DA] bg-warm-offwhite px-6 py-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-neutral-900"
            >
              หน้าแรก
            </Link>
            <Link
              href="/products?category=guitars"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-gray hover:text-neutral-900"
            >
              กีต้าร์
            </Link>
            <Link
              href="/products?category=keyboards"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-gray hover:text-neutral-900"
            >
              คีย์บอร์ด
            </Link>
            <Link
              href="/products?category=drums"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-gray hover:text-neutral-900"
            >
              กลอง
            </Link>
            <Link
              href="/products?category=pro-audio"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-gray hover:text-neutral-900"
            >
              เครื่องเสียงโปร
            </Link>
            <Link
              href="/brands"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-gray hover:text-neutral-900"
            >
              แบรนด์
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-gray hover:text-neutral-900"
            >
              ประวัติการสั่งซื้อ
            </Link>
            <div className="pt-2 border-t border-[#E5E2DA] sm:hidden">
              <LoginButton />
            </div>
          </nav>
        </div>
      )}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
