"use client";

import Link from "next/link";
import { Guitar, Music, Disc, Volume2, ArrowUpRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  engName: string;
  href: string;
  imageUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  count: string;
  colSpan: string;
  description: string;
}

const categories: CategoryItem[] = [
  {
    id: "guitars",
    name: "กีต้าร์ไฟฟ้า & เบส",
    engName: "Electric Guitars",
    href: "/products?category=guitars",
    imageUrl: "/catagory/guitar.jpg",
    icon: Guitar,
    count: "120+ รายการ",
    colSpan: "lg:col-span-1 lg:row-span-2 lg:h-[540px] md:h-[540px] min-h-[380px]",
    description: "From screaming leads to crushing rhythms, find your voice.",
  },
  {
    id: "keyboards",
    name: "คีย์บอร์ด & เปียโน",
    engName: "Synths & Keys",
    href: "/products?category=keyboards",
    imageUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80",
    icon: Music,
    count: "85+ รายการ",
    colSpan: "lg:col-span-1 lg:row-span-1 lg:h-[258px] md:h-[258px] min-h-[250px]",
    description: "Sculpt new soundscapes.",
  },
  {
    id: "drums",
    name: "กลองชุด & อุปกรณ์",
    engName: "Drums",
    href: "/products?category=drums",
    imageUrl: "/catagory/drum.jpg",
    icon: Disc,
    count: "60+ รายการ",
    colSpan: "lg:col-span-1 lg:row-span-1 lg:h-[258px] md:h-[258px] min-h-[250px]",
    description: "The heartbeat of the stage.",
  },
  {
    id: "pro-audio",
    name: "เครื่องเสียงโปร & สตูดิโอ",
    engName: "Pro Audio",
    href: "/products?category=pro-audio",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
    icon: Volume2,
    count: "150+ รายการ",
    colSpan: "lg:col-span-2 lg:row-span-1 lg:h-[258px] md:h-[258px] min-h-[250px]",
    description: "Studio-grade interfaces, mics, and monitors.",
  },
];

export function CategoryGrid() {
  return (
    <section className="relative flex flex-col justify-center bg-white py-16 px-6 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute bottom-1/4 right-1/4 z-0 h-[400px] w-[400px] rounded-full bg-electric-blue/5 blur-[120px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl w-full relative z-10 pt-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="flex flex-col gap-1.5 text-left">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl leading-1.5 pb-5">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-amber-spotlight">หมวดหมู่ยอดนิยม</span>
            </h2>
            <p className="text-slate-gray text-sm sm:text-base leading-5">
              Gear engineered for live performance • อุปกรณ์ดนตรีประสิทธิภาพสูงเพื่อเวทีจริง
            </p>
          </div>
          
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-sm font-semibold text-electric-blue hover:text-electric-blue/80 transition-colors duration-200"
          >
            ดูหมวดหมู่ทั้งหมด
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isTall = category.id === "guitars";
            return (
              <Link
                key={category.id}
                href={category.href}
                className={cn(
                  "group relative flex flex-col justify-end rounded-3xl border border-[#E5E2DA] bg-warm-offwhite/50 overflow-hidden transition-all duration-500 hover:border-electric-blue/30 hover:shadow-[0_15px_35px_rgba(47,93,255,0.08)]",
                  category.colSpan
                )}
              >
                {/* Background Image with Hover Scale */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 filter brightness-[0.65] saturate-[0.85]"
                  />
                  {/* Soft Warm/Dark Overlays for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent transition-all duration-500 group-hover:via-neutral-950/30" />
                  <div className="absolute inset-0 bg-electric-blue/0 transition-all duration-500 group-hover:bg-electric-blue/5" />
                </div>

                {/* Glowing Orb inside the card on hover */}
                <div className="absolute -bottom-10 -right-10 z-10 w-32 h-32 rounded-full bg-amber-spotlight/0 blur-3xl transition-all duration-500 group-hover:bg-amber-spotlight/15 group-hover:scale-150" />

                {/* Category Card Content */}
                <div className={cn(
                  "relative z-20 flex flex-col justify-between h-full w-full",
                  isTall ? "p-8 md:p-10" : "p-6 md:p-8"
                )}>
                  {/* Top line with Icon and Arrow */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-500 group-hover:border-electric-blue/40 group-hover:bg-electric-blue group-hover:text-white">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-neutral-300 opacity-0 -translate-y-2 translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col gap-1.5 mt-auto pt-10">
                    <span className="text-[10px] font-bold tracking-widest text-amber-spotlight group-hover:text-orange-400 transition-colors duration-300 uppercase">
                      {category.engName}
                    </span>
                    <h3 className="font-heading text-xl md:text-2xl font-bold text-white group-hover:translate-x-1 transition-transform duration-300">
                      {category.name}
                    </h3>
                    <p className="text-xs text-neutral-300/90 group-hover:text-neutral-100 transition-colors duration-300 max-w-lg mt-0.5 line-clamp-2">
                      {category.description}
                    </p>
                    <p className="text-[10px] text-neutral-400 group-hover:text-neutral-200 transition-colors duration-300 mt-1 font-medium">
                      {category.count}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
