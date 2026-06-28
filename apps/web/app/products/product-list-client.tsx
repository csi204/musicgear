"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, Home } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Product,
  guitarProducts,
  keyboardProducts,
  drumProducts,
  proAudioProducts,
} from "../../lib/products-data";

interface ProductListClientProps {
  initialCategory?: string;
  initialBrand?: string;
}

export function ProductListClient({ initialCategory, initialBrand }: ProductListClientProps) {
  const [selectedColors, setSelectedColors] = useState<{ [productId: string]: string }>({});

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
    let products = [
      ...guitarProducts,
      ...keyboardProducts,
      ...drumProducts,
      ...proAudioProducts,
    ];

    if (initialCategory) {
      switch (initialCategory) {
        case "keyboards":
          title = "คีย์บอร์ดทั้งหมด";
          bannerUrl = "/hero/hero_keyboard.png";
          breadcrumb = "คีย์บอร์ด";
          products = keyboardProducts;
          break;
        case "drums":
          title = "กลองทั้งหมด";
          bannerUrl = "/catagory/drum.jpg";
          breadcrumb = "กลอง";
          products = drumProducts;
          break;
        case "pro-audio":
          title = "เครื่องเสียงโปรทั้งหมด";
          bannerUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80";
          breadcrumb = "เครื่องเสียงโปร";
          products = proAudioProducts;
          break;
        case "guitars":
          title = "กีต้าร์ทั้งหมด";
          bannerUrl = "/catagory/guitar.jpg";
          breadcrumb = "กีต้าร์";
          products = guitarProducts;
          break;
        default:
          break;
      }
    }

    if (initialBrand) {
      const brandUpper = initialBrand.toUpperCase();
      products = products.filter((p) => p.brand.toUpperCase() === brandUpper);
      title = `${brandUpper} Collection`;
      breadcrumb = initialCategory ? `${breadcrumb} / ${brandUpper}` : brandUpper;
      
      // Select a nice fallback banner if not categorized
      if (!initialCategory) {
        bannerUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80";
      }
    }

    return {
      title,
      bannerUrl,
      breadcrumb,
      products,
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
            {details.products.map((product) => {
              const activeColor = selectedColors[product.id] || product.colors[0]?.name;
              const hasDiscount = !!product.originalPrice;
              const discountPercentage = hasDiscount
                ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                : 0;

              return (
                <div key={product.id} className="flex flex-col gap-3">
                  {/* TODO: [product-svc] product.id is used as slug (mock only). Replace with product.slug when connecting product-svc */}
                <Link href={`/products/${product.id}`} className="group flex flex-col gap-3">
                    {/* Product Image Container */}
                    <div className="relative aspect-[4/3] w-full rounded-2xl border border-[#E5E2DA] bg-[#F5F3EE]/20 overflow-hidden flex items-center justify-center p-4 transition-all duration-300 group-hover:border-electric-blue/20">
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <span className="absolute top-4 left-4 z-10 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                          Save {discountPercentage}%
                        </span>
                      )}
                      
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
    </div>
  );
}
