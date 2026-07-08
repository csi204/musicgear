"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { 
  Plus, 
  Minus, 
  Lock, 
  ArrowLeft, 
  Trash2, 
  HelpCircle, 
  ChevronDown, 
  Truck 
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useCart } from "../../hooks/useCart";
import { isAuthenticated, buildLoginUrl } from "../../lib/auth";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [shippingNote, setShippingNote] = useState("");
  const [isOpenShippingCalc, setIsOpenShippingCalc] = useState(false);
  const [isOpenDiscount, setIsOpenDiscount] = useState(false);

  // Check auth state
  useEffect(() => {
    setIsUserLoggedIn(isAuthenticated());
  }, []);

  // Shipping Calculations
  const freeShippingThreshold = 1500;
  const isEligibleForFreeShipping = totalPrice >= freeShippingThreshold;
  const shippingPercent = Math.min((totalPrice / freeShippingThreshold) * 100, 100);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!isUserLoggedIn) {
      e.preventDefault();
      // Redirect to Kinde Login flow and return to checkout
      window.location.href = buildLoginUrl("/checkout");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      {/* Header / Navigation bar */}
      <Navbar />

      {/* Main page content wrapper */}
      <main className="flex-grow py-12 px-6">
        <div className="mx-auto max-w-7xl">
          
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-[#E5E2DA] pb-6 text-left">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-neutral-950 tracking-tight">
                Your cart (ตะกร้าสินค้า)
              </h1>
              <p className="text-xs text-slate-gray mt-1 font-semibold uppercase tracking-wider">
                คุณมีสินค้า {totalItems} รายการในตะกร้า
              </p>
            </div>
            
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-white px-5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-all cursor-pointer w-fit"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Continue shopping
            </Link>
          </div>

          {items.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#E5E2DA] py-20 px-6 text-center max-w-md mx-auto shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-slate-gray mx-auto mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-lg font-bold text-neutral-950 mb-2">
                ตะกร้าของคุณว่างเปล่า
              </h2>
              <p className="text-sm text-slate-gray mb-8">
                ยังไม่มีการเพิ่มเครื่องดนตรีชิ้นใดลงตะกร้าในขณะนี้
              </p>
              <Link 
                href="/products" 
                className="inline-flex items-center justify-center rounded-full bg-electric-blue text-white px-6 py-3 font-semibold hover:bg-electric-blue/90 transition-all cursor-pointer"
              >
                เลือกซื้อสินค้า
              </Link>
            </div>
          ) : (
            /* Main Split Layout: Cart List vs Order Summary */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Side: Table of items - ColSpan 8 */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Items Table container */}
                <div className="bg-white rounded-3xl border border-[#E5E2DA] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse text-sm text-left">
                      <thead>
                        <tr className="border-b border-[#E5E2DA] bg-[#F5F3EE]/20 text-slate-gray font-bold text-xs uppercase tracking-wider">
                          <th className="py-4 px-6 w-1/2">Product (สินค้า)</th>
                          <th className="py-4 px-4 text-center">Quantity (จำนวน)</th>
                          <th className="py-4 px-6 text-right">Total (รวม)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F3EE]">
                        {items.map((item) => (
                          <tr key={item.id} className="group">
                            {/* Product Info Column */}
                            <td className="py-6 px-6 flex gap-4 items-center">
                              <div className="h-20 w-20 shrink-0 rounded-xl border border-[#E5E2DA] bg-[#F5F3EE]/25 p-2 flex items-center justify-center">
                                <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-[9px] font-bold tracking-wider text-slate-gray uppercase font-heading">
                                  {item.brand}
                                </span>
                                <h3 className="font-heading text-sm font-bold text-neutral-950 mt-0.5 line-clamp-1">
                                  {item.title}
                                </h3>
                                <span className="text-[11px] text-slate-gray font-medium mt-1">
                                  Color: {item.color}
                                </span>
                                <span className="text-xs font-semibold text-neutral-900 mt-2.5">
                                  {item.price.toLocaleString()} ฿
                                </span>
                              </div>
                            </td>

                            {/* Quantity Selector Column */}
                            <td className="py-6 px-4">
                              <div className="flex flex-col items-center gap-2">
                                <div className="inline-flex items-center rounded-lg border border-[#DEDCD4] bg-white p-0.5">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-[#F5F3EE] transition-all"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-10 text-center text-xs font-semibold text-neutral-800">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-[#F5F3EE] transition-all"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-[11px] font-bold text-slate-gray hover:text-red-500 hover:underline transition-colors mt-1"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>

                            {/* Total Price Column */}
                            <td className="py-6 px-6 text-right font-bold text-neutral-950 text-sm font-heading">
                              {(item.price * item.quantity).toLocaleString()} ฿
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Options: Accordions */}
                <div className="space-y-3">
                  
                  {/* Shipping calculator accordion */}
                  <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden shadow-sm text-left">
                    <button
                      onClick={() => setIsOpenShippingCalc(!isOpenShippingCalc)}
                      className="flex w-full items-center justify-between px-6 py-4 font-bold text-sm text-neutral-950 transition-colors hover:bg-[#F5F3EE]/20"
                    >
                      <span>Estimate shipping rates (คำนวณอัตราจัดส่ง)</span>
                      <ChevronDown className={cn("h-4 w-4 text-slate-gray transition-transform duration-200", isOpenShippingCalc ? "rotate-180" : "")} />
                    </button>
                    {isOpenShippingCalc && (
                      <div className="px-6 pb-6 pt-2 border-t border-[#F5F3EE]">
                        <p className="text-xs text-slate-gray leading-relaxed">
                          * ระบบจัดส่งฟรีทั่วประเทศเมื่อสั่งซื้อยอดรวม 1,500 ฿ ขึ้นไป หากต่ำกว่า 1,500 ฿ ระบบจะทำการคำนวณตามจริงเริ่มต้นที่ 80 ฿ ในหน้าชำระเงิน
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Discount accordion */}
                  <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden shadow-sm text-left">
                    <button
                      onClick={() => setIsOpenDiscount(!isOpenDiscount)}
                      className="flex w-full items-center justify-between px-6 py-4 font-bold text-sm text-neutral-950 transition-colors hover:bg-[#F5F3EE]/20"
                    >
                      <span>Discount (รหัสส่วนลดคูปอง)</span>
                      <ChevronDown className={cn("h-4 w-4 text-slate-gray transition-transform duration-200", isOpenDiscount ? "rotate-180" : "")} />
                    </button>
                    {isOpenDiscount && (
                      <div className="px-6 pb-6 pt-2 border-t border-[#F5F3EE] flex gap-3">
                        <input
                          type="text"
                          placeholder="ใส่รหัสส่วนลด..."
                          className="h-10 rounded-xl border border-[#DEDCD4] bg-white px-4 text-xs text-neutral-900 placeholder-slate-gray outline-none flex-grow"
                        />
                        <button className="h-10 rounded-xl bg-neutral-900 text-white font-bold text-xs px-6 hover:bg-neutral-800 transition-all cursor-pointer">
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Right Side: Order Summary Panel - ColSpan 4 */}
              <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E5E2DA] p-6 shadow-sm text-left space-y-6">
                
                {/* Shipping alert box */}
                <div className="rounded-2xl bg-[#F5F3EE]/30 border border-[#E5E2DA]/80 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Truck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-950 leading-tight">
                        {isEligibleForFreeShipping 
                          ? "You are eligible for free shipping." 
                          : `Spend ${(freeShippingThreshold - totalPrice).toLocaleString()} ฿ more to get free shipping!`
                        }
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-[#F5F3EE] overflow-hidden mt-2.5">
                        <div 
                          className="h-full bg-neutral-950 transition-all duration-500"
                          style={{ width: `${shippingPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="border-b border-[#E5E2DA]/50 pb-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-gray tracking-wider uppercase">Subtotal</span>
                    <span className="text-2xl font-extrabold font-heading text-neutral-950">
                      {totalPrice.toLocaleString()} ฿ THB
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-gray font-medium mt-2 block">
                    Taxes included and shipping calculated at checkout.
                  </span>
                </div>

                {/* Shipping Note (Order notes) */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Add a note to your order
                  </span>
                  <textarea
                    rows={4}
                    value={shippingNote}
                    onChange={(e) => setShippingNote(e.target.value)}
                    placeholder="ความต้องการเพิ่มเติม เช่น ระมัดระวังเป็นพิเศษ..."
                    className="w-full rounded-2xl border border-[#DEDCD4] bg-white p-4 text-xs text-neutral-900 placeholder-slate-gray outline-none focus:border-neutral-400 transition-all resize-none"
                  />
                </div>

                {/* Call to Action checkout buttons */}
                <div className="space-y-3 pt-4 border-t border-[#E5E2DA]/50">
                  <Link
                    href="/checkout"
                    onClick={handleCheckoutClick}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 font-bold text-sm text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    {!isUserLoggedIn && <Lock className="h-4.5 w-4.5 mr-0.5 text-neutral-300" />}
                    Check out
                  </Link>

                  <button 
                    onClick={() => {
                      if(confirm("ต้องการล้างสินค้าในตะกร้าทั้งหมดหรือไม่?")) {
                        clearCart();
                      }
                    }}
                    className="w-full text-center text-xs font-semibold text-slate-gray hover:text-red-500 hover:underline transition-colors py-2 cursor-pointer"
                  >
                    ล้างตะกร้าสินค้าทั้งหมด (Clear Cart)
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
