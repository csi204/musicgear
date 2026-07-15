"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { X, Search, Loader2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getApiBaseUrl } from "../lib/auth";

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimatingOut(false);
      setIsVisible(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Debounced search query fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const url = `${getApiBaseUrl()}/products?limit=6&status=active&search=${encodeURIComponent(
          searchQuery.trim()
        )}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ok" && data.products) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Instant search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleClear = () => {
    setSearchQuery("");
    setProducts([]);
    inputRef.current?.focus();
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        style={{
          animation: isAnimatingOut
            ? "fadeInOverlay 0.3s ease reverse both"
            : "fadeInOverlay 0.25s ease both",
        }}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-[#E5E2DA]",
          isAnimatingOut ? "animate-slide-out-right" : "animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 font-heading">
            Search
          </h2>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 active:scale-95 transition-all"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="px-6 py-2">
          <div className="relative flex items-center bg-stone-100 rounded-2xl p-4 shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเครื่องดนตรี..."
              className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none pr-12 font-medium"
            />
            {searchQuery ? (
              <button
                onClick={handleClear}
                className="absolute right-4 text-xs font-bold text-stone-500 hover:text-stone-950 transition-colors uppercase tracking-wider"
              >
                Clear
              </button>
            ) : (
              <Search className="absolute right-4 h-4 w-4 text-stone-400" />
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
              <span className="text-xs font-medium">กำลังค้นหา...</span>
            </div>
          )}

          {!loading && searchQuery.trim() && products.length === 0 && (
            <div className="py-12 text-center text-sm text-stone-400 font-medium">
              ไม่พบสินค้าที่ตรงกับการค้นหา
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 font-heading">
                  Products
                </h3>
              </div>

              <div className="flex flex-col gap-3.5">
                {products.map((product) => {
                  const imageUrl = product.images && product.images.length > 0
                    ? `${getApiBaseUrl()}/products/images/${
                        product.images.find((img: any) => img.isPrimary)?.imageUrl ||
                        product.images[0].imageUrl
                      }`
                    : "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80";

                  return (
                    <Link
                      key={product.productId}
                      href={`/products/${product.slug}`}
                      onClick={handleClose}
                      className="flex items-center gap-4 p-2 rounded-xl hover:bg-stone-50 transition-all group"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-stone-100 bg-stone-50 shadow-sm">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {product.brand?.name || "Generic"}
                        </span>
                        <h4 className="text-sm font-semibold text-stone-900 truncate pr-2 group-hover:text-stone-950 transition-colors">
                          {product.name}
                        </h4>
                        <span className="text-xs font-bold text-stone-600 mt-0.5">
                          {Number(product.price).toLocaleString()} ฿
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
