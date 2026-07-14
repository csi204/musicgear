"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartContext } from "../cart-provider";
import { showToast } from "../toast";
import { getApiBaseUrl, getAccessToken } from "../../lib/auth";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Loader2,
  Plus,
  CheckCircle2,
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

// --- Types ---
interface BundleProduct {
  productId: string;
  name: string;
  sku: string;
  price: string;
  images: { imageUrl: string }[];
  brand?: { name: string };
}

interface BundleItem {
  bundleItemId: string;
  bundleId: string;
  productId: string;
  quantity: number;
  product: BundleProduct;
}

interface Bundle {
  bundleId: string;
  name: string;
  description?: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  imageUrl?: string | null;
  items: BundleItem[];
}

interface Product {
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description?: string;
  brand?: { name: string };
  images: { imageUrl: string }[];
}

// --- Theme Helper based on Mockup ---
const getBundleTheme = (bundleName: string, index: number) => {
  const normalized = bundleName.toLowerCase();
  const themeIndex = index % 3;

  if (normalized.includes("starter") || themeIndex === 0) {
    return {
      color: "#FF6B00",
      bulletColor: "#FF6B00"
    };
  }
  if (normalized.includes("creator") || themeIndex === 1) {
    return {
      color: "#7C3AED",
      bulletColor: "#7C3AED"
    };
  }
  return {
    color: "#2563EB",
    bulletColor: "#2563EB"
  };
};

export function HomeClient() {
  const router = useRouter();
  const { addItem } = useCartContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [beginnerProducts, setBeginnerProducts] = useState<Product[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [loadingBeginners, setLoadingBeginners] = useState(true);

  const [addingBundleId, setAddingBundleId] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Fetch Bundles and Beginner Products
  useEffect(() => {
    async function loadData() {
      const apiBase = getApiBaseUrl();

      // 1. Fetch Bundles (Limit to 4 bundles to fit viewport cleanly)
      try {
        setLoadingBundles(true);
        const res = await fetch(`${apiBase}/products/bundles`);
        if (res.ok) {
          const data = await res.json();
          setBundles(data.bundles?.slice(0, 4) || []);
        }
      } catch (err) {
        console.error("Failed to load bundles on home:", err);
      } finally {
        setLoadingBundles(false);
      }

      // 2. Fetch Beginner Products
      try {
        setLoadingBeginners(true);
        const res = await fetch(`${apiBase}/products?skillLevel=beginner&limit=4`);
        if (res.ok) {
          const data = await res.json();
          setBeginnerProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to load beginner products on home:", err);
      } finally {
        setLoadingBeginners(false);
      }
    }

    loadData();
  }, []);

  // Handle direct buy now for a whole bundle
  const handleBuyNowBundle = async (bundle: Bundle) => {
    if (addingBundleId) return;
    setAddingBundleId(bundle.bundleId);

    try {
      const apiBase = getApiBaseUrl();
      const token = getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const cartRes = await fetch(`${apiBase}/carts`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      if (!cartRes.ok) throw new Error("Failed to create temporary checkout cart");
      const cartData = await cartRes.json();
      const tempCartId = cartData.cartId;

      const discountValue = Number(bundle.discountValue);
      const isPercent = bundle.discountType === "percentage";

      const regularSum = bundle.items.reduce((sum, item) => {
        return sum + (Number(item.product.price) * item.quantity);
      }, 0);

      const addRequests = bundle.items.map((item) => {
        const originalPrice = Number(item.product.price);
        let finalPrice = originalPrice;

        if (isPercent) {
          finalPrice = originalPrice * (1 - discountValue / 100);
        } else {
          const itemRatio = originalPrice / regularSum;
          const proportionalDiscount = discountValue * itemRatio;
          finalPrice = Math.max(0, originalPrice - proportionalDiscount);
        }

        finalPrice = Math.round(finalPrice * 100) / 100;

        return fetch(`${apiBase}/carts/${tempCartId}/items`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            productId: item.product.productId,
            title: `${item.product.name} (จากเซ็ต ${bundle.name})`,
            price: finalPrice,
            quantity: item.quantity,
            color: "Standard",
            imageUrl: item.product.images?.[0]?.imageUrl
              ? `${apiBase}/products/images/${item.product.images[0].imageUrl}`
              : "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300",
            brand: item.product.brand?.name || "Generic",
          }),
        });
      });

      const responses = await Promise.all(addRequests);
      if (responses.some(r => !r.ok)) throw new Error("Failed to add all bundle items to temp cart");

      router.push(`/checkout?buyNowCartId=${tempCartId}`);
    } catch (err) {
      console.error("Buy now bundle failed:", err);
      showToast("ไม่สามารถซื้อเซ็ตสินค้าได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAddingBundleId(null);
    }
  };

  // Handle adding single beginner product to cart
  const handleAddProductToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (addingProductId) return;
    setAddingProductId(product.productId);

    try {
      await addItem({
        productId: product.productId,
        title: product.name,
        price: product.price,
        quantity: 1,
        color: "Standard",
        imageUrl: product.images?.[0]?.imageUrl
          ? `${getApiBaseUrl()}/products/images/${product.images[0].imageUrl}`
          : "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300",
        brand: product.brand?.name || "Generic",
      });
      showToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว!`);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
      showToast("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้");
    } finally {
      setAddingProductId(null);
    }
  };

  // Scroll Slider Handler
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.firstElementChild?.clientWidth || 340;
      const gap = 24; // gap-6 is 24px
      const scrollAmount = direction === "left" ? -(cardWidth + gap) : (cardWidth + gap);
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Image Fallback Handler
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300";
  };

  const apiBase = getApiBaseUrl();

  return (
    <div className="w-full">
      {/* CSS style block to hide scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ── SECTION 1: PROMOTIONAL BUNDLE SETS (FULL SCREEN HEIGHT & VERTICALLY CENTERED) ── */}
      <section className="w-full min-h-[calc(130vh-300px)] flex flex-col justify-center bg-white border-y border-stone-200/50 py-10">
        <div className="max-w-screen-xl mx-auto px-6 w-full">
          {/* Header Section */}

          <div className="flex items-end justify-between mb-8">

            {/* ฝั่งซ้ายเว้นไว้เพื่อบาลานซ์ */}
            <div className="w-20" />

            {/* Title */}
            <div className="text-center">
              <span className="text-[30px] font-extrabold text-[#FF6B00] uppercase block mb-1 font-heading">
                BUNDLES
              </span>

              <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827]">
                เลือกเซ็ตที่ใช่ สำหรับคุณ
              </h2>

              <p className="text-[13px] text-[#6B7280] font-medium mt-1">
                เซ็ตสุดคุ้ม รวมสินค้ายอดนิยม ในราคาพิเศษ
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 w-20 justify-end">
              <button onClick={() => scroll("left")}>
                <ChevronLeft className="h-8 w-8 rounded-full border border-stone-200 bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-50 hover:border-stone-300 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer" />
              </button>

              <button onClick={() => scroll("right")}>
                <ChevronRight className="h-8 w-8 rounded-full border border-stone-200 bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-50 hover:border-stone-300 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer" />
              </button>
            </div>
          </div>

          {loadingBundles ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-stone-200/40 p-6 h-[445px] flex flex-col gap-6 animate-pulse">
                  <div className="h-4 w-32 bg-neutral-200 rounded" />
                  <div className="h-32 w-full bg-neutral-200 rounded-xl" />
                  <div className="h-16 w-full bg-neutral-200 rounded-xl" />
                  <div className="h-10 w-full bg-neutral-200 rounded-full mt-auto" />
                </div>
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <div className="py-12 text-center border border-stone-200/40 rounded-2xl max-w-sm mx-auto p-6 shadow-sm">
              <ShoppingBag className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#111827]">ไม่มีโปรโมชั่นจัดเซ็ตในขณะนี้</p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className={cn(
                "flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-1",
                bundles.length <= 3 && "lg:justify-center"
              )}
            >
              {bundles.map((bundle, idx) => {
                const theme = getBundleTheme(bundle.name, idx);

                const sortedItems = [...bundle.items].sort((a, b) => Number(b.product.price) - Number(a.product.price));
                const mainItem = sortedItems[0];

                const regularSum = bundle.items.reduce((sum, item) => {
                  return sum + (Number(item.product.price) * item.quantity);
                }, 0);

                const discountValue = Number(bundle.discountValue);
                const isPercent = bundle.discountType === "percentage";
                const bundlePrice = isPercent
                  ? regularSum * (1 - discountValue / 100)
                  : regularSum - discountValue;

                const savedAmount = regularSum - bundlePrice;

                return (
                  <div
                    key={bundle.bundleId}
                    className="w-[calc(100vw-48px)] sm:w-[330px] md:w-[350px] shrink-0 snap-start bg-white rounded-2xl border border-stone-200/60 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:border-stone-300/80 group relative h-[445px]"
                    style={{ padding: "16px" }}
                  >
                    <div>
                      {/* 1. Header (หัวข้อซ้าย + ลำดับขวา) */}
                      <div className="flex justify-between items-start gap-4 mb-2 h-[38px] overflow-hidden">
                        <div className="flex-1 flex flex-col text-left">
                          <h3 className="font-heading text-[13.5px] font-extrabold text-[#111827] tracking-tight leading-snug line-clamp-1">
                            {bundle.name}
                          </h3>
                          <p className="text-[10px] text-[#6B7280] font-medium leading-normal mt-0.5 line-clamp-1">
                            {bundle.description || "เซ็ตแนะนำชุดพิเศษเพื่อคุณโดยเฉพาะ"}
                          </p>
                        </div>
                        <span className="text-[9px] font-extrabold text-[#6B7280] bg-neutral-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5 shadow-sm">
                          เซ็ตที่ {idx + 1}
                        </span>
                      </div>

                      {/* 2. Image Area */}
                      <div className="h-[140px] w-full flex items-center justify-center rounded-xl p-2 bg-[#F5F3EE]/30 mb-2 relative overflow-hidden border border-stone-200/50 shadow-inner group-hover:bg-[#F5F3EE]/45 transition-colors duration-300">
                        {bundle.imageUrl ? (
                          <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border border-stone-200/40 p-1 shadow-sm transition-transform duration-500 group-hover:scale-[1.01]">
                            <img
                              src={`${apiBase}/products/images/${bundle.imageUrl}`}
                              alt={bundle.name}
                              className="max-h-full max-w-full object-contain"
                              onError={handleImgError}
                            />
                          </div>
                        ) : (
                          mainItem && (
                            <div className="w-full h-full flex items-center justify-center bg-black rounded-lg border border-stone-200/40 p-2 shadow-sm transition-transform duration-500 group-hover:scale-[1.01]">
                              <img
                                src={mainItem.product.images?.[0]?.imageUrl
                                  ? `${apiBase}/products/images/${mainItem.product.images[0].imageUrl}`
                                  : "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300"}
                                alt={mainItem.product.name}
                                className="max-h-full max-w-full object-contain"
                                onError={handleImgError}
                              />
                            </div>
                          )
                        )}
                      </div>

                      {/* 3. Items List */}
                      <div className="h-[105px] overflow-y-auto mb-2 pr-1 text-left space-y-1.5 custom-scrollbar">
                        {bundle.items.map((item) => (
                          <div key={item.bundleItemId} className="flex gap-2 items-start group/item mb-2">
                            <span
                              style={{ backgroundColor: `${theme.color}12`, color: theme.color }}
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full mt-0.5 shadow-sm"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" style={{ color: theme.color }} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[10.5px] text-[#111827] line-clamp-1 leading-tight">
                                {item.product.name}
                              </h4>
                              <p className="text-[9px] text-[#6B7280] mt-0.5 font-medium leading-none">
                                จำนวน: {item.quantity} · ราคาปกติ {Number(item.product.price).toLocaleString()} ฿
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Price + Button */}
                    <div className="border-t border-stone-200/50 pt-2 mt-auto">
                      <div className="flex flex-col text-center mb-2 gap-0.5">
                        <div className="flex items-center justify-center gap-1.5 text-[9.5px]">
                          <span className="text-[#6B7280] line-through font-medium">
                            ปกติ {regularSum.toLocaleString()} ฿
                          </span>
                          <span
                            style={{ color: theme.color }}
                            className="font-extrabold uppercase"
                          >
                            ประหยัด {savedAmount.toLocaleString()} ฿
                          </span>
                        </div>
                        <span
                          style={{ color: theme.color }}
                          className="font-heading text-lg sm:text-xl font-black block tracking-tight leading-tight mt-0.5"
                        >
                          {Math.round(bundlePrice).toLocaleString()} ฿
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyNowBundle(bundle)}
                        disabled={addingBundleId === bundle.bundleId}
                        className={cn(
                          "w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-[9.5px] tracking-wider py-2.5 cursor-pointer active:scale-[0.98] transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        )}
                      >
                        {addingBundleId === bundle.bundleId ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            กำลังดำเนินการ...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3" />
                            ดูรายละเอียด / ซื้อเลย
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
