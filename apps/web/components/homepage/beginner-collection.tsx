"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Star, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getApiBaseUrl } from "../../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  categoryId: string;
  name: string;
  description?: string;
}

interface Product {
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description?: string;
  category?: { categoryId: string; name: string };
  brand?: { name: string };
  images: { imageUrl: string; isPrimary?: boolean; sortOrder?: number }[];
  skillLevel?: string;
}

// ─── Category card visual config (matched to DB names) ────────────────────────

const CATEGORY_VISUAL: Record<string, {
  label: string;
  description: string;
  accent: string;
  bgColor: string;
  imageSrc: string;
}> = {
  Guitars: {
    label: "กีตาร์",
    description: "เหมาะสำหรับ\nผู้เริ่มต้นเล่นกีตาร์",
    accent: "#FF6B00",
    bgColor: "#FFF5EE",
    imageSrc: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80",
  },
  Keyboards: {
    label: "คีย์บอร์ด",
    description: "เริ่มต้นเรียนรู้\nคีย์บอร์ดได้ง่าย",
    accent: "#2563EB",
    bgColor: "#EEF3FF",
    imageSrc: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=500&q=80",
  },
  Drums: {
    label: "กลอง",
    description: "ซ้อมได้ทุกเวลา\nไม่รบกวนใคร",
    accent: "#16A34A",
    bgColor: "#EEFAF2",
    imageSrc: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=500&q=80",
  },
  "Pro Audio": {
    label: "เครื่องเสียง",
    description: "อุปกรณ์บันทึกเสียง\nเริ่มต้นคุณภาพดี",
    accent: "#7C3AED",
    bgColor: "#F3F0FF",
    imageSrc: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=500&q=80",
  },
};

// DB category names in the exact order we want to show
const CATEGORY_ORDER = ["Guitars", "Keyboards", "Drums", "Pro Audio"];

const sortOptions = [
  { label: "แนะนำ", value: "recommended" },
  { label: "ราคา: น้อย → มาก", value: "price_asc" },
  { label: "ราคา: มาก → น้อย", value: "price_desc" },
  { label: "ใหม่ล่าสุด", value: "newest" },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3 w-3",
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : star - 0.5 <= rating
                ? "fill-amber-400/50 text-amber-400"
                : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      {count > 0 && (
        <span className="text-[11px] text-neutral-500 font-medium">({count})</span>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden animate-pulse">
      <div className="bg-neutral-100" style={{ aspectRatio: "4/3" }} />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 bg-neutral-200 rounded-full" />
        <div className="h-4 w-3/4 bg-neutral-200 rounded-full" />
        <div className="h-3 w-1/2 bg-neutral-200 rounded-full" />
        <div className="h-5 w-1/3 bg-neutral-200 rounded-full" />
        <div className="h-3 w-2/3 bg-neutral-200 rounded-full" />
      </div>
    </div>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="rounded-3xl border border-neutral-100 bg-white overflow-hidden animate-pulse" style={{ minHeight: "280px" }}>
      <div className="bg-neutral-100" style={{ minHeight: "160px" }} />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-neutral-200 rounded-full" />
        <div className="h-5 w-32 bg-neutral-200 rounded-full" />
        <div className="h-3 w-24 bg-neutral-200 rounded-full" />
        <div className="h-6 w-20 bg-neutral-200 rounded-full" />
        <div className="h-8 w-full bg-neutral-200 rounded-full" />
      </div>
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

function BeginnerCategoryCard({
  category,
  minPrice,
  minPricesLoading,
  apiBase,
}: {
  category: Category;
  minPrice: number | null;
  minPricesLoading: boolean;
  apiBase: string;
}) {
  const visual = CATEGORY_VISUAL[category.name];
  if (!visual) return null;

  const href = `/products?categoryId=${category.categoryId}&skillLevel=beginner`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-neutral-200"
      style={{ minHeight: "280px" }}
    >
      {/* Image */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ backgroundColor: visual.bgColor, minHeight: "160px" }}
      >
        <img
          src={visual.imageSrc}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: visual.accent }}
          >
            Beginner
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 bg-white">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: visual.accent }}>
            Beginner
          </p>
          <h3 className="font-heading text-lg font-extrabold text-neutral-900 leading-tight tracking-tight">
            {visual.label}
          </h3>
        </div>
        <p className="text-[12px] text-neutral-500 leading-relaxed whitespace-pre-line">
          {visual.description}
        </p>
        <div>
          <p className="text-[10px] text-neutral-400 font-medium">เริ่มต้น</p>
          {minPricesLoading ? (
            <div className="mt-1 h-6 w-24 animate-pulse rounded-full bg-neutral-200" />
          ) : minPrice !== null ? (
            <p className="text-xl font-black tracking-tight" style={{ color: visual.accent }}>
              {minPrice.toLocaleString("th-TH")} ฿
            </p>
          ) : (
            <p className="text-sm font-semibold text-neutral-400">ไม่มีสินค้าในขณะนี้</p>
          )}
        </div>
        <button
          className="mt-1 w-full rounded-full py-2 text-[12px] font-bold text-white transition-all duration-200 active:scale-[0.97]"
          style={{ backgroundColor: "#111827" }}
        >
          ดูสินค้า →
        </button>
      </div>
    </Link>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  apiBase,
}: {
  product: Product;
  apiBase: string;
}) {
  const rawImageUrl = product.images?.[0]?.imageUrl ?? "";
  const imageUrl = rawImageUrl.startsWith("http")
    ? rawImageUrl
    : rawImageUrl
    ? `${apiBase}/products/images/${rawImageUrl}`
    : "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400";

  const price = typeof product.price === "number"
    ? product.price
    : parseFloat(String(product.price));

  const originalPrice = product.originalPrice
    ? typeof product.originalPrice === "number"
      ? product.originalPrice
      : parseFloat(String(product.originalPrice))
    : undefined;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] hover:border-blue-200"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-neutral-50" style={{ aspectRatio: "4/3" }}>
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400";
          }}
        />
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-[#FF3B30] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              SAVE {discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Info: 2-Column layout to match screenshot */}
      <div className="flex items-start justify-between gap-4 p-4">
        {/* Left Side: Brand & Product Name */}
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {product.brand?.name || "GENERIC"}
          </span>
          <h3 className="text-[13px] font-extrabold text-neutral-900 leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors duration-200 mt-0.5">
            {product.name}
          </h3>
        </div>

        {/* Right Side: Price & Original Price */}
        <div className="text-right shrink-0 flex flex-col items-end">
          <span className="text-[14px] font-black text-[#FF3B30] tracking-tight">
            {price.toLocaleString("th-TH")} ฿
          </span>
          {hasDiscount && (
            <span className="text-[11px] font-semibold text-neutral-400 line-through mt-0.5">
              {originalPrice.toLocaleString("th-TH")} ฿
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function BeginnerCollection() {
  const apiBase = getApiBaseUrl();

  // DB categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Min prices per category — computed from allProducts (no extra requests)
  const [minPrices, setMinPrices] = useState<Record<string, number | null>>({});
  const [minPricesLoading, setMinPricesLoading] = useState(true);

  // All beginner products cached — filter happens client-side
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Product list (filtered view)
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeSort, setActiveSort] = useState("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // ── 1. Fetch categories on mount (Independent) ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${apiBase}/products/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        if (cancelled) return;
        
        const cats: Category[] = data.categories || [];
        const resolvedCats = CATEGORY_ORDER
          .map((name) => cats.find((c) => c.name === name))
          .filter(Boolean) as Category[];
        setCategories(resolvedCats);
      } catch (err) {
        console.error("[BeginnerCollection] Categories error:", err);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    loadCategories();
    return () => { cancelled = true; };
  }, [apiBase]);

  // ── 2. Fetch all beginner products on mount (Independent) ──────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/products?skillLevel=beginner&limit=200`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        if (cancelled) return;

        const allProds: Product[] = data.products || [];
        setAllProducts(allProds);
        setProducts(allProds);
      } catch (err) {
        console.error("[BeginnerCollection] Products error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, [apiBase]);

  // ── 3. Reactive minimum price calculation ─────────────────────────────────
  // Computes client-side as soon as BOTH categories and products are ready
  useEffect(() => {
    if (categories.length === 0 || allProducts.length === 0) {
      return;
    }

    setMinPricesLoading(true);
    const mins: Record<string, number | null> = {};
    for (const cat of categories) {
      const catProds = allProducts.filter(
        (p) => p.category?.categoryId === cat.categoryId
      );
      mins[cat.categoryId] =
        catProds.length > 0
          ? Math.min(...catProds.map((p) => parseFloat(String(p.price))))
          : null;
    }
    setMinPrices(mins);
    setMinPricesLoading(false);
  }, [categories, allProducts]);

  // ── Client-side filter when chip changes (no network request) ─────────────
  useEffect(() => {
    if (activeFilter === "all") {
      setProducts(allProducts);
    } else {
      setProducts(
        allProducts.filter((p) => p.category?.categoryId === activeFilter)
      );
    }
    setShowAll(false);
  }, [activeFilter, allProducts]);

  // Client-side sort
  const sortedProducts = [...products].sort((a, b) => {
    const pa = parseFloat(String(a.price));
    const pb = parseFloat(String(b.price));
    if (activeSort === "price_asc") return pa - pb;
    if (activeSort === "price_desc") return pb - pa;
    return 0;
  });

  const displayedProducts = showAll ? sortedProducts : sortedProducts.slice(0, 8);
  const activeSortLabel = sortOptions.find((o) => o.value === activeSort)?.label ?? "แนะนำ";

  // Build filter chips from DB categories
  const filterChips = [
    { label: "ทั้งหมด", value: "all" },
    ...categories.map((cat) => ({
      label: CATEGORY_VISUAL[cat.name]?.label ?? cat.name,
      value: cat.categoryId,
    })),
  ];

  return (
    <section className="w-full bg-white py-16">
      <div className="mx-auto max-w-screen-xl px-6 w-full">

        {/* ── TOP AREA ── */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 mb-14">

          {/* Left: Headline + CTA */}
          <div className="flex-shrink-0 lg:w-[280px] flex flex-col justify-center gap-5">
            <span className="inline-flex w-fit items-center rounded-full bg-[#FF6B00]/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#FF6B00]">
              Beginner
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 leading-[1.15]">
              เริ่มต้นเล่นดนตรี
              <br />
              <span className="text-[#FF6B00]">ได้ง่ายกว่าที่คิด</span>
            </h2>
            <p className="text-[14px] text-neutral-500 leading-relaxed">
              รวมอุปกรณ์เริ่มต้นคุณภาพดี ในราคาที่คุ้มค่า
              <br />
              พร้อมให้คุณก้าวแรกสู่โลกแห่งเสียงดนตรี
            </p>
            <Link
              href="/products?skillLevel=beginner"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#FF6B00] px-6 py-3 text-[13px] font-bold text-white transition-all duration-200 hover:bg-[#e55f00] hover:shadow-[0_8px_24px_rgba(255,107,0,0.3)] active:scale-[0.97]"
            >
              ดูอุปกรณ์ทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: 4 Category Cards (from DB) */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categoriesLoading
              ? Array.from({ length: 4 }).map((_, i) => <CategoryCardSkeleton key={i} />)
              : categories.map((cat) => (
                  <BeginnerCategoryCard
                    key={cat.categoryId}
                    category={cat}
                    minPrice={minPrices[cat.categoryId] ?? null}
                    minPricesLoading={minPricesLoading}
                    apiBase={apiBase}
                  />
                ))}
          </div>
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="mb-8 rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                เลือกประเภทอุปกรณ์
              </span>
              {filterChips.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => {
                    setActiveFilter(chip.value);
                    setShowAll(false);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200 active:scale-[0.97]",
                    activeFilter === chip.value
                      ? "border-[#FF6B00] bg-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[12px] font-semibold text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
              >
                เรียงตาม: {activeSortLabel}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-neutral-400 transition-transform duration-200",
                    sortOpen && "rotate-180"
                  )}
                />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={cn(
                        "flex w-full items-center px-4 py-3 text-left text-[12.5px] font-medium transition-colors duration-150 hover:bg-neutral-50",
                        activeSort === option.value
                          ? "bg-[#FFF5EE] text-[#FF6B00] font-bold"
                          : "text-neutral-700"
                      )}
                      onClick={() => {
                        setActiveSort(option.value);
                        setSortOpen(false);
                      }}
                    >
                      {activeSort === option.value && (
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#FF6B00] inline-block flex-shrink-0" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION TITLE ── */}
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              อุปกรณ์ทั้งหมด{" "}
              <span className="text-[#FF6B00]">(Beginner Friendly)</span>
            </h3>
            {!loading && (
              <span className="text-[12px] font-medium text-neutral-400">
                ({sortedProducts.length} รายการ)
              </span>
            )}
          </div>

          {activeFilter !== "all" && (
            <button
              onClick={() => {
                setActiveFilter("all");
                setShowAll(false);
              }}
              className="text-xs font-bold text-[#FF6B00] hover:text-[#e55f00] transition-colors flex items-center gap-1 cursor-pointer"
            >
              ← กลับไปดูสินค้าทั้งหมด
            </button>
          )}
        </div>

        {/* ── PRODUCT GRID ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <span className="text-2xl">🎵</span>
            </div>
            <p className="text-sm font-semibold text-neutral-800">
              ไม่พบสินค้า Beginner ในหมวดนี้
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              ลองเลือกประเภทอื่น หรือดูสินค้าทั้งหมด
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                apiBase={apiBase}
              />
            ))}
          </div>
        )}

        {/* ── SHOW MORE / LESS ── */}
        {!loading && sortedProducts.length > 8 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-8 py-3.5 text-[13px] font-bold text-neutral-700 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md active:scale-[0.97]"
            >
              {showAll ? "แสดงน้อยลง" : `ดูทั้งหมด ${sortedProducts.length} รายการ`}
              <ArrowRight className={cn("h-4 w-4", showAll && "rotate-180")} />
            </button>
          </div>
        )}
      </div>

      {/* Click-outside to close sort */}
      {sortOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setSortOpen(false)}
        />
      )}
    </section>
  );
}
