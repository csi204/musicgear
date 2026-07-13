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
import { useCartContext } from "./cart-provider";
import { isAuthenticated } from "../lib/auth";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } =
    useCartContext();
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
      window.location.href = "/login?callbackUrl=/checkout";
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
        <div className="flex items-center justify-between border-b border-neutral-100 px-8 py-6">
          <div className="flex items-baseline gap-4">
            <span className="text-[22px] font-extrabold text-neutral-900 tracking-tight flex items-start">
              Cart
            </span>
            
          </div>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-4 w-4 stroke-[1.5]" />
          </button>
        </div>

        {/* ── FREE SHIPPING BAR (Only show if there are items) ── */}
        {items.length > 0 && (
          <div className="px-8 pt-6 pb-2 border-b border-neutral-100">
            <p className="text-[13px] font-bold text-neutral-900 mb-3">
              {isEligibleForFreeShipping
                ? "You are eligible for free shipping."
                : `Spend ${amountLeft.toLocaleString()} ฿ more to get free shipping!`}
            </p>
            <div className="h-1.5 w-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-neutral-900 transition-all duration-700 ease-out"
                style={{ width: `${shippingPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ── CART ITEMS ── */}
        <div className="flex-grow overflow-y-auto">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-20 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                  Your cart is currently empty.
                </h3>
                <p className="text-xs text-stone-500 max-w-[240px] mx-auto leading-relaxed">
                  Not sure where to start? Browse our collections to find the perfect gear.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-2.5 text-xs font-semibold text-white hover:bg-stone-850 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Continue shopping</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 px-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-6 items-start">
                  {/* Product Image */}
                  <div className="h-[84px] w-[84px] shrink-0 rounded-[10px] bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.imageUrl || undefined}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-grow flex-col min-w-0 pr-2">
                    <h4 className="text-[13px] font-semibold text-neutral-900 leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-medium text-neutral-500 mt-1">
                      {item.color || "Standard"}
                    </span>
                    <span className="text-[13px] font-bold text-neutral-900 mt-2">
                      {item.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ฿
                    </span>
                  </div>

                  {/* Qty Stepper + Remove */}
                  <div className="flex flex-col items-end gap-3 shrink-0 self-start">
                    <div className="flex items-center justify-between bg-[#f7f7f7] rounded-[8px] px-3 py-1.5 w-[68px]">
                      <span className="text-[13px] font-bold text-neutral-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-3.5 w-4 items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                        </button>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-3.5 w-4 items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <ChevronDown className="h-3 w-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[11px] font-bold text-neutral-600 underline underline-offset-[3px] decoration-neutral-400 hover:text-neutral-900 hover:decoration-neutral-900 transition-colors mr-1"
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
          <div className="border-t border-neutral-100 bg-[#fafafa] px-8 py-6 space-y-8 pb-10">
            {/* Quick-action row: Order note | Shipping | Discount */}
            <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-transparent">
              <button className="flex items-center justify-center gap-2 py-2 px-1 text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer">
                <FileText className="h-4 w-4" />
                <span className="text-[12px] font-bold">Order note</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2 px-1 text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer">
                <Truck className="h-4 w-4" />
                <span className="text-[12px] font-bold">Shipping</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2 px-1 text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer">
                <Tag className="h-4 w-4" />
                <span className="text-[12px] font-bold">Discount</span>
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Taxes + Subtotal row */}
              <div className="flex items-start justify-between gap-4">
                <p className="text-[13px] font-bold text-neutral-900 leading-snug max-w-[180px]">
                  Taxes included and shipping calculated at checkout.
                </p>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-neutral-900 mb-1">
                    Subtotal
                  </p>
                  <p className="text-xl font-bold text-neutral-900 leading-none">
                    {totalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ฿ THB
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href="/checkout"
                  onClick={handleCheckoutClick}
                  className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#1c1c1c] font-bold text-[15px] text-white hover:bg-black transition-all cursor-pointer active:scale-[0.98]"
                >
                  {!isUserLoggedIn && (
                    <Lock className="h-4 w-4 text-neutral-400 stroke-[2]" />
                  )}
                  Check out
                </Link>

                <Link
                  href="/cart"
                  onClick={handleClose}
                  className="flex h-[52px] flex-1 items-center justify-center rounded-full border border-neutral-800 bg-transparent font-medium text-[15px] text-neutral-900 hover:bg-white hover:shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                >
                  View cart
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
