"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, Home, Scale, X, ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getApiBaseUrl } from "../../lib/auth";
import { useCartContext } from "../../components/cart-provider";
import { showToast } from "../../components/toast";

export interface Product {
  id: string;
  productId: string;
  brand: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  colors: { name: string; hex: string }[];
  imagesByColor?: { [color: string]: string };
  rating?: number;
  reviewsCount?: number;
  stockStatus?: string;
  descriptionLong?: string;
  specifications?: { label: string; value: string }[];
}

interface ProductListClientProps {
  initialCategory?: string;
  initialBrand?: string;
}

export function ProductListClient({ initialCategory, initialBrand }: ProductListClientProps) {
  const [selectedColors, setSelectedColors] = useState<{ [productId: string]: string }>({});
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Comparison States
  const [compareList, setCompareList] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const { addItem } = useCartContext();
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const toggleCompare = (product: any) => {
    const exists = compareList.some((p) => p.productId === product.productId);
    if (exists) {
      setCompareList((prev) => prev.filter((p) => p.productId !== product.productId));
      return;
    }
    if (compareList.length >= 4) {
      showToast("คุณสามารถเปรียบเทียบสินค้าได้สูงสุด 4 รายการเท่านั้น");
      return;
    }
    setCompareList((prev) => [...prev, product]);
  };

  const isProductSelectedForCompare = (productId: string) => {
    return compareList.some((p) => p.productId === productId);
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("mg_cached_products");
          if (cached) {
            setProducts(JSON.parse(cached));
            setLoading(false);
          } else {
            setLoading(true);
          }
        } else {
          setLoading(true);
        }

        const res = await fetch(`${getApiBaseUrl()}/products?limit=100&status=active`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ok" && data.products) {
            setProducts(data.products);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("mg_cached_products", JSON.stringify(data.products));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleColorClick = (productId: string, colorName: string) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: colorName,
    }));
  };

  const getProductImage = (product: Product) => {
    const activeColor = selectedColors[product.id];
    if (activeColor && product.imagesByColor?.[activeColor]) {
      return product.imagesByColor[activeColor];
    }
    return product.imageUrl;
  };

  // Get dynamic content based on category and brand
  const getFilteredDetails = () => {
    let title = "สินค้าทั้งหมด";
    let bannerUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80";
    let breadcrumb = "สินค้าทั้งหมด";
    
    let displayProducts: Product[] = [];

    if (products.length > 0) {
      displayProducts = products.map((p: any) => ({
        id: p.slug, // URL slug
        productId: p.productId, // DB UUID
        brand: p.brand?.name || "GENERIC",
        title: p.name,
        price: Number(p.price),
        originalPrice: Number(p.price) * 1.15, // mock original price
        imageUrl: p.images && p.images.length > 0 
          ? `${getApiBaseUrl()}/products/images/${p.images.find((img: any) => img.isPrimary)?.imageUrl || p.images[0].imageUrl}`
          : "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80",
        colors: [
          { name: "Standard", hex: "#4B5563" }
        ],
        rating: 4.8,
        reviewsCount: 15,
        stockStatus: p.status === "active" ? "In Stock" : "Out of Stock",
        descriptionLong: p.description || "สินค้าแบรนด์ดังคุณภาพระดับพรีเมียมจาก MusicGear",
        specifications: [
          { label: "SKU", value: p.sku },
          { label: "Level", value: p.skillLevel || "All Levels" },
          ...(p.specifications && Array.isArray(p.specifications)
            ? p.specifications.map((s: any) => ({
                label: s.definition?.name || "Spec",
                value: s.value
              }))
            : [])
        ],
        imagesGallery: p.images && p.images.length > 0
          ? p.images.map((img: any) => `${getApiBaseUrl()}/products/images/${img.imageUrl}`)
          : [],
        accessories: [],
        comparisons: []
      }));
    } else {
      displayProducts = [];
    }

    if (initialCategory) {
      const catLower = initialCategory.toLowerCase();
      switch (catLower) {
        case "keyboards":
          title = "คีย์บอร์ดทั้งหมด";
          bannerUrl = "/hero/hero_keyboard.png";
          breadcrumb = "คีย์บอร์ด";
          displayProducts = displayProducts.filter(p => {
                const orig = products.find(o => o.slug === p.id);
                return orig?.category?.name?.toLowerCase().includes("keyboard");
              });
          break;
        case "drums":
          title = "กลองทั้งหมด";
          bannerUrl = "/catagory/drum.jpg";
          breadcrumb = "กลอง";
          displayProducts = displayProducts.filter(p => {
                const orig = products.find(o => o.slug === p.id);
                return orig?.category?.name?.toLowerCase().includes("drum");
              });
          break;
        case "pro-audio":
          title = "เครื่องเสียงโปรทั้งหมด";
          bannerUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80";
          breadcrumb = "เครื่องเสียงโปร";
          displayProducts = displayProducts.filter(p => {
                const orig = products.find(o => o.slug === p.id);
                return orig?.category?.name?.toLowerCase().match(/audio|sound|speaker/);
              });
          break;
        case "guitars":
          title = "กีต้าร์ทั้งหมด";
          bannerUrl = "/catagory/guitar.jpg";
          breadcrumb = "กีต้าร์";
          displayProducts = displayProducts.filter(p => {
                const orig = products.find(o => o.slug === p.id);
                return orig?.category?.name?.toLowerCase().includes("guitar");
              });
          break;
        default:
          break;
      }
    }

    if (initialBrand) {
      const brandUpper = initialBrand.toUpperCase();
      displayProducts = displayProducts.filter((p) => p.brand.toUpperCase() === brandUpper);
      title = `${brandUpper} Collection`;
      breadcrumb = initialCategory ? `${breadcrumb} / ${brandUpper}` : brandUpper;
      
      if (!initialCategory) {
        bannerUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80";
      }
    }

    return {
      title,
      bannerUrl,
      breadcrumb,
      products: displayProducts,
    };
  };

  const details = getFilteredDetails();

  return (
    <div className="flex flex-col bg-white">
      {/* Dynamic Header Banner with Large Bottom Corners */}
      <div className="relative h-[320px] overflow-hidden rounded-b-[40px] md:rounded-b-[50px] bg-neutral-950">
        <img
          src={details.bannerUrl}
          alt={`${details.title} Collection Banner`}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.4]"
        />
        {/* Subtle radial dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-900/40 to-transparent" />
        
        {/* Banner Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl h-full px-6 flex flex-col justify-end pb-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-400 uppercase font-heading mb-3">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">Collections</span>
            <span className="text-neutral-600">/</span>
            <span className="text-white">{details.breadcrumb}</span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
            {details.title}
          </h1>
        </div>
      </div>

      {/* Filter and Sort Row */}
      <div className="bg-white py-6">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          {/* Show filters pill */}
          <button className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-xs md:text-sm font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 transition-all cursor-pointer">
            <SlidersHorizontal className="h-4 w-4 text-neutral-600" />
            Show filters
          </button>

          {/* Sort dropdown pill */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-gray font-medium hidden sm:inline">Sort by:</span>
            <button className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-xs md:text-sm font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 transition-all cursor-pointer">
              Best selling
              <ChevronDown className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid Section */}
      <div className="bg-white pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex flex-col gap-3 text-left">
                  <div className="relative aspect-[4/3] w-full rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200" />
                  <div className="h-3 w-16 bg-neutral-200 animate-pulse rounded mt-2" />
                  <div className="h-4 w-40 bg-neutral-200 animate-pulse rounded" />
                  <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded" />
                  <div className="h-5 w-16 bg-neutral-200 animate-pulse rounded mt-2" />
                </div>
              ))
            ) : details.products.map((product) => {
              const activeColor = selectedColors[product.id] || product.colors[0]?.name;
              const hasDiscount = !!product.originalPrice;
              const discountPercentage = hasDiscount
                ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                : 0;

              return (
                <div key={product.id} className="flex flex-col gap-3">
                  {/* TODO: [product-svc] product.id is used as slug (mock only). Replace with product.slug when connecting product-svc */}
                <Link href={`/products/${product.id}`} className="group flex flex-col gap-3 relative">
                    {/* Product Image Container */}
                    <div className="relative aspect-[4/3] w-full rounded-2xl border border-[#E5E2DA] bg-[#F5F3EE]/20 overflow-hidden flex items-center justify-center p-4 transition-all duration-300 group-hover:border-electric-blue/20">
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <span className="absolute top-4 left-4 z-10 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                          Save {discountPercentage}%
                        </span>
                      )}

                      {/* Compare Overlay Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCompare(product);
                        }}
                        className={cn(
                          "absolute top-4 right-4 z-20 flex h-7.5 w-7.5 items-center justify-center rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer",
                          isProductSelectedForCompare(product.productId)
                            ? "bg-stone-900 border-stone-900 text-white"
                            : "bg-white/90 backdrop-blur-sm border-stone-200 text-stone-500 hover:text-stone-950 hover:bg-white"
                        )}
                        aria-label="เปรียบเทียบสินค้า"
                        title="เปรียบเทียบสินค้า"
                      >
                        <Scale className={cn("h-3.5 w-3.5 transition-all duration-300", isProductSelectedForCompare(product.productId) ? "scale-110 rotate-12" : "")} />
                      </button>
                      
                      {/* Image */}
                      <img
                        src={getProductImage(product)}
                        alt={product.title}
                        className="h-full w-full object-contain transition-all duration-500 ease-out group-hover:scale-105"
                      />
                    </div>

                    {/* Details Area */}
                    <div className="flex flex-col gap-1.5 px-1">
                      {/* Vendor and Title / Price Layout */}
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Vendor and Title */}
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-bold tracking-widest text-slate-gray uppercase font-heading">
                            {product.brand}
                          </span>
                          <h3 className="font-heading text-sm font-semibold text-neutral-900 mt-0.5 line-clamp-2 leading-snug group-hover:text-electric-blue transition-colors duration-200">
                            {product.title}
                          </h3>
                        </div>

                        {/* Right: Price */}
                        <div className="text-right flex flex-col items-end min-w-[85px]">
                          <span className={cn(
                            "text-sm font-bold font-heading",
                            hasDiscount ? "text-red-500" : "text-neutral-900"
                          )}>
                            {product.price.toLocaleString()} ฿
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-slate-gray line-through font-medium">
                              {product.originalPrice!.toLocaleString()} ฿
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Color Swatches (Outside Link to avoid nested interactive elements) */}
                  {product.colors.length > 0 && (
                    <div className="flex items-center gap-2 mt-0 px-1">
                      {product.colors.map((color) => {
                        const isActive = activeColor === color.name;
                        return (
                          <button
                            key={color.name}
                            onClick={() => handleColorClick(product.id, color.name)}
                            title={color.name}
                            className={cn(
                              "h-3.5 w-3.5 rounded-full border border-neutral-300 transition-all cursor-pointer hover:scale-110 active:scale-95",
                              isActive ? "ring-2 ring-offset-2 ring-electric-blue border-transparent scale-110" : ""
                            )}
                            style={{ background: color.hex }}
                            aria-label={`Select ${color.name} color`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-stone-200/80 shadow-2xl rounded-2xl px-5 py-4 flex items-center justify-between gap-6 max-w-2xl w-[calc(100%-2rem)] animate-in slide-in-from-bottom-10 duration-300">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1">
            <span className="text-xs font-bold font-heading uppercase tracking-wider text-stone-900 hidden sm:inline whitespace-nowrap">
              เปรียบเทียบ ({compareList.length}/4):
            </span>
            <div className="flex items-center gap-2">
              {compareList.map((p) => (
                <div key={p.productId} className="relative h-11 w-11 rounded-lg border border-stone-200 bg-stone-50 p-1 flex-shrink-0">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={() => toggleCompare(p)}
                    className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-red-500 text-white rounded-full flex items-center justify-center border border-white hover:bg-red-600 transition-all cursor-pointer shadow-sm"
                    aria-label="Remove product"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareList([])}
              className="text-xs font-semibold text-stone-500 hover:text-stone-950 transition-colors py-2 px-3 whitespace-nowrap cursor-pointer"
            >
              ล้างทั้งหมด
            </button>
            <button
              disabled={compareList.length < 2}
              onClick={() => setIsCompareModalOpen(true)}
              className={cn(
                "rounded-full px-5 py-2.5 text-xs font-bold font-heading tracking-wide uppercase shadow-md transition-all duration-300 active:scale-95 whitespace-nowrap cursor-pointer",
                compareList.length >= 2
                  ? "bg-stone-950 text-white hover:bg-stone-850 hover:shadow-lg"
                  : "bg-stone-100 text-stone-400 border border-stone-200/50 cursor-not-allowed shadow-none"
              )}
            >
              เปรียบเทียบเลย
            </button>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 p-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-stone-900">
                  เปรียบเทียบสเปกสินค้า ({compareList.length} รายการ)
                </h3>
                <p className="text-xs text-slate-gray mt-0.5">
                  เปรียบเทียบข้อมูลจำเพาะและราคาของเครื่องดนตรีแต่ละรุ่นเคียงข้างกัน
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-950 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content Table */}
            <div className="flex-grow overflow-auto p-6">
              <table className="w-full border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="py-4 text-left font-bold text-stone-400 uppercase tracking-wider w-[150px] min-w-[120px]">
                      ฟีเจอร์ / รายละเอียด
                    </th>
                    {compareList.map((p) => (
                      <th key={p.productId} className="py-4 px-6 text-left font-bold w-[250px] min-w-[200px]">
                        <div className="flex flex-col gap-2">
                          <div className="aspect-[4/3] w-full rounded-xl border border-stone-100 bg-stone-50 p-2 flex items-center justify-center max-h-[120px]">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold tracking-widest text-slate-gray uppercase font-heading">
                              {p.brand}
                            </span>
                            <h4 className="font-heading text-xs font-bold text-stone-900 line-clamp-2 leading-snug mt-0.5">
                              {p.title}
                            </h4>
                            <span className="block text-sm font-bold font-heading text-stone-950 mt-1">
                              {p.price.toLocaleString()} ฿
                            </span>
                          </div>
                          
                          {/* Add to Cart Button */}
                          <button
                            onClick={async () => {
                              try {
                                setAddingToCartId(p.productId);
                                await addItem({
                                  productId: p.productId,
                                  title: p.title,
                                  price: p.price,
                                  quantity: 1,
                                  color: "Standard",
                                  imageUrl: p.imageUrl,
                                  brand: p.brand,
                                });
                                showToast(`เพิ่ม ${p.title} ลงตะกร้าแล้ว!`);
                              } catch (err: any) {
                                showToast(err.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้า");
                              } finally {
                                setAddingToCartId(null);
                              }
                            }}
                            disabled={addingToCartId === p.productId || p.stockStatus === "Out of Stock"}
                            className={cn(
                              "w-full rounded-full py-2 px-3 text-[11px] font-bold font-heading tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                              p.stockStatus === "Out of Stock"
                                ? "bg-stone-100 text-stone-400 cursor-not-allowed shadow-none"
                                : "bg-stone-950 text-white hover:bg-stone-850 hover:shadow"
                            )}
                          >
                            {addingToCartId === p.productId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-3.5 w-3.5" />
                            )}
                            {p.stockStatus === "Out of Stock" ? "สินค้าหมด" : "ใส่ตะกร้า"}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {/* Price */}
                  <tr>
                    <td className="py-4 font-bold text-stone-800">ราคา (Price)</td>
                    {compareList.map((p) => (
                      <td key={p.productId} className="py-4 px-6 font-bold text-stone-950">
                        {p.price.toLocaleString()} ฿
                      </td>
                    ))}
                  </tr>

                  {/* Brand */}
                  <tr>
                    <td className="py-4 font-bold text-stone-800">ยี่ห้อ (Brand)</td>
                    {compareList.map((p) => (
                      <td key={p.productId} className="py-4 px-6 text-stone-600 font-medium">
                        {p.brand}
                      </td>
                    ))}
                  </tr>

                  {/* Level */}
                  <tr>
                    <td className="py-4 font-bold text-stone-800">ระดับทักษะ (Level)</td>
                    {compareList.map((p) => {
                      const level = p.specifications?.find((s: any) => s.label === "Level")?.value || "All Levels";
                      return (
                        <td key={p.productId} className="py-4 px-6 text-stone-600 font-medium">
                          {level}
                        </td>
                      );
                    })}
                  </tr>

                  {/* SKU */}
                  <tr>
                    <td className="py-4 font-bold text-stone-800">รหัสสินค้า (SKU)</td>
                    {compareList.map((p) => {
                      const sku = p.specifications?.find((s: any) => s.label === "SKU")?.value || "-";
                      return (
                        <td key={p.productId} className="py-4 px-6 text-stone-500 font-mono text-[11px]">
                          {sku}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Stock Status */}
                  <tr>
                    <td className="py-4 font-bold text-stone-800">สถานะสต็อก (Stock)</td>
                    {compareList.map((p) => {
                      const isOutOfStock = p.stockStatus === "Out of Stock";
                      return (
                        <td key={p.productId} className="py-4 px-6 font-semibold">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] uppercase font-bold",
                            isOutOfStock ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          )}>
                            {isOutOfStock ? "Out of Stock" : "In Stock"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Dynamic Specifications */}
                  {Array.from(new Set(
                    compareList.flatMap(p => p.specifications || [])
                      .map((s: any) => s.label)
                      .filter((label: string) => label !== "SKU" && label !== "Level")
                  )).map((label: any) => (
                    <tr key={label} className="border-b border-stone-100">
                      <td className="py-4 font-bold text-stone-800">{label}</td>
                      {compareList.map((p) => {
                        const val = p.specifications?.find((s: any) => s.label === label)?.value || "-";
                        return (
                          <td key={p.productId} className="py-4 px-6 text-stone-650 font-semibold text-xs sm:text-sm">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Description */}
                  <tr>
                    <td className="py-4 font-bold text-stone-800">รายละเอียดสินค้า</td>
                    {compareList.map((p) => (
                      <td key={p.productId} className="py-4 px-6 text-stone-500 leading-relaxed text-xs max-w-[250px]">
                        {p.descriptionLong || "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
