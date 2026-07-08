"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Lock,
  ShoppingCart,
  FileText,
  Truck,
  Tag,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useCart } from "../hooks/useCart";
import { isAuthenticated, buildLoginUrl } from "../lib/auth";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } =
    useCart();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    setIsUserLoggedIn(isAuthenticated());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimatingOut(false);
      setIsVisible(true);
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

  const freeShippingThreshold = 1500;
  const isEligibleForFreeShipping = totalPrice >= freeShippingThreshold;
  const shippingPercent = Math.min(
    (totalPrice / freeShippingThreshold) * 100,
    100
  );
  const amountLeft = freeShippingThreshold - totalPrice;

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!isUserLoggedIn) {
      e.preventDefault();
      window.location.href = buildLoginUrl("/checkout");
    }
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
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between border-b border-[#E5E2DA] px-6 py-5">
          <div className="flex items-baseline gap-3">
            {/* "Cart²" — bordered box style like in image */}
            <span className="font-heading text-lg font-bold text-neutral-950 border border-neutral-950 px-2 py-0.5 rounded leading-none">
              Cart
              <sup className="text-[11px] font-bold">{totalItems}</sup>
            </span>
            <span className="text-sm font-medium text-neutral-400 tracking-wide">
              Recently viewed
            </span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DEDCD4] bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all cursor-pointer"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── FREE SHIPPING BAR ── */}
        <div className="px-6 pt-4 pb-3 border-b border-[#E5E2DA]/40">
          <p className="text-xs font-bold text-neutral-900 mb-2">
            {isEligibleForFreeShipping
              ? "You are eligible for free shipping. 🎉"
              : `Spend ${amountLeft.toLocaleString()} ฿ more to get free shipping!`}
          </p>
          <div className="h-[3px] w-full rounded-full bg-[#E5E2DA] overflow-hidden">
            <div
              className="h-full bg-neutral-950 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${shippingPercent}%` }}
            />
          </div>
        </div>

        {/* ── CART ITEMS ── */}
        <div className="flex-grow overflow-y-auto">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE]">
                <ShoppingCart className="h-7 w-7 text-slate-gray" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-neutral-950">
                  ตะกร้าของคุณยังว่างอยู่
                </h3>
                <p className="text-xs text-slate-gray mt-1.5 leading-relaxed">
                  เลือกเครื่องดนตรีที่โดนใจแล้วเริ่มต้นบทเพลงของคุณ
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-all cursor-pointer"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F3EE]">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 px-6 py-5 items-start">
                  {/* Product Image */}
                  <div className="h-[80px] w-[80px] shrink-0 rounded-xl border border-[#E5E2DA] bg-[#F5F3EE]/30 flex items-center justify-center overflow-hidden p-1.5">
                    <img
                      src={item.imageUrl || undefined}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-grow flex-col min-w-0">
                    <h4 className="font-heading text-sm font-bold text-neutral-900 leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    {item.color && (
                      <span className="text-[11px] text-slate-gray mt-0.5">
                        {item.color}
                      </span>
                    )}
                    <span className="text-sm font-bold text-neutral-950 mt-2">
                      {item.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ฿
                    </span>
                  </div>

                  {/* Qty Stepper + Remove */}
                  <div className="flex flex-col items-end gap-2 shrink-0 self-start">
                    {/* Arrow-style stepper like in reference image */}
                    <div className="flex items-center gap-1.5 border border-[#DEDCD4] rounded-lg px-2 py-1 bg-white">
                      <span className="text-sm font-semibold text-neutral-800 w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-4 w-4 items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-4 w-4 items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[11px] font-semibold text-slate-gray hover:text-red-500 hover:underline transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER (only when items exist) ── */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E2DA] bg-[#F5F3EE]/20 px-6 py-5 space-y-4">
            {/* Quick-action row: Order note | Shipping | Discount */}
            <div className="grid grid-cols-3 divide-x divide-[#E5E2DA] border border-[#E5E2DA] rounded-xl overflow-hidden bg-white">
              <button className="flex flex-col items-center gap-1.5 py-2.5 px-1 text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
                <FileText className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Order note</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-2.5 px-1 text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
                <Truck className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Shipping</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-2.5 px-1 text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
                <Tag className="h-4 w-4" />
                <span className="text-[10px] font-semibold">Discount</span>
              </button>
            </div>

            {/* Taxes + Subtotal row */}
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold text-neutral-600 leading-snug max-w-[160px]">
                Taxes included and shipping calculated at checkout.
              </p>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-semibold text-slate-gray uppercase tracking-wide">
                  Subtotal
                </p>
                <p className="font-heading text-lg font-extrabold text-neutral-950 leading-tight">
                  {totalPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ฿ THB
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2.5">
              <Link
                href="/checkout"
                onClick={handleCheckoutClick}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 font-bold text-sm text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                {!isUserLoggedIn && (
                  <Lock className="h-4 w-4 text-neutral-400" />
                )}
                Check out
              </Link>

              <Link
                href="/cart"
                onClick={handleClose}
                className="flex h-12 w-full items-center justify-center rounded-full border border-neutral-950 bg-white font-bold text-sm text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer active:scale-[0.98]"
              >
                View cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
