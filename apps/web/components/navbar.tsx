"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { LoginButton } from "./login-button";
import { useState, useEffect, useRef } from "react";
import { useCartContext } from "./cart-provider";
import { CartDrawer } from "./cart-drawer";
import { SearchDrawer } from "./search-drawer";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";

const NAV_LINKS = [
  { label: "กีต้าร์", href: "/products?category=guitars" },
  { label: "คีย์บอร์ด", href: "/products?category=keyboards" },
  { label: "กลอง", href: "/products?category=drums" },
  { label: "เครื่องเสียง", href: "/products?category=pro-audio" },
  { label: "แบรนด์", href: "/brands" },
];

export function Navbar() {
  const { totalItems } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener("mg_open_cart", handleOpenCart);
    return () => window.removeEventListener("mg_open_cart", handleOpenCart);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500 ease-in-out",
          scrolled
            ? "bg-white/75 backdrop-blur-md border-b border-stone-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] h-14"
            : "bg-white border-b border-stone-200/50 h-16"
        )}
      >
        <div className="mx-auto flex h-full max-w-screen-xl items-center px-6 relative gap-4">
          
          {/* ── LEFT: Premium Logo ── */}
          <Link
            href="/"
            className="flex-shrink-0 z-10 flex items-center gap-1 group"
          >
            <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-all duration-300 group-hover:tracking-[0.25em]">
              MusicGear
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          </Link>

          {/* ── CENTER: Modern Navigation Links ── */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2 z-10">
            {NAV_LINKS.map((link) => {
              const isActive = pathname?.includes(link.href.split("?")[1] ?? "__never__");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors duration-300 ease-out group select-none active:scale-95 whitespace-nowrap",
                    isActive ? "text-stone-950" : "text-stone-500 hover:text-stone-950"
                  )}
                >
                  <span>{link.label}</span>
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-[1.5px] bg-stone-950 transition-transform duration-300 ease-out origin-center",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT: Actions (Search, Login, Cart) ── */}
          <div className="flex items-center gap-2.5 ml-auto z-10">
            
            {/* Search Bar - Instant Live Search Drawer */}
            <div className="relative hidden lg:flex items-center">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full text-stone-500 hover:text-stone-950 hover:bg-stone-50 transition-all duration-300 active:scale-95 cursor-pointer"
                aria-label="ค้นหา"
              >
                <Search className="h-[16px] w-[16px]" />
              </button>
            </div>

            {/* Subtle vertical separator */}
            <div className="hidden lg:block w-px h-4 bg-stone-200" />

            {/* User Account Button */}
            <div className="transition-all duration-300 hover:scale-105 active:scale-95">
              <LoginButton compact />
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full text-stone-500 hover:text-stone-950 hover:bg-stone-50 transition-all duration-300 active:scale-95 cursor-pointer group"
              aria-label="ตะกร้าสินค้า"
            >
              <ShoppingCart className="h-[16px] w-[16px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-stone-950 text-[9px] font-bold text-white ring-2 ring-white transition-all duration-300">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Icon */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full text-stone-500 hover:text-stone-950 hover:bg-stone-50 transition-all duration-300"
                aria-label="เมนู"
              >
                {mobileMenuOpen ? (
                  <X className="h-4.5 w-4.5 rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu className="h-4.5 w-4.5 transition-transform duration-300" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile Menu Dropdown (Accordion Animation) ── */}
        <div
          className={cn(
            "md:hidden bg-white border-b border-stone-200 overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="px-6 py-4 flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50 hover:text-stone-950 transition-all"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50 hover:text-stone-950 transition-all"
            >
              ประวัติการสั่งซื้อ
            </Link>
            
            {/* Mobile Search Button */}
            <div className="relative mt-2.5 pt-3 border-t border-stone-100">
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex h-9 w-full items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 text-xs text-stone-400 outline-none transition-all text-left"
              >
                <Search className="h-3.5 w-3.5 text-stone-400 mr-2 inline" />
                <span>ค้นหาเครื่องดนตรี...</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
