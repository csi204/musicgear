"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useState, useEffect } from "react";
import { cn } from "@workspace/ui/lib/utils";

interface Slide {
  id: string;
  bgImage: string;
  titlePrefix: string;
  titleSuffix: string;
  taglinePrefix: string;
  taglineHighlight: string;
  description: string;
  link: string;
}

const slides: Slide[] = [
  {
    id: "guitar",
    bgImage: "/hero/hero_guita.png",
    titlePrefix: "Obsidian",
    titleSuffix: "Guitars",
    taglinePrefix: "Start Your ",
    taglineHighlight: "Musical Journey",
    description: "ค้นพบกีต้าร์คู่ใจที่ใช่สำหรับคุณ คีย์เสียงที่เป็นเอกลักษณ์ และเริ่มต้นเรียนรู้ด้วยความมั่นใจ มีรุ่นแนะนำสำหรับทั้งผู้เริ่มต้นและนักดนตรีเวทีมือโปร",
    link: "/products?category=guitars",
  },
  {
    id: "keyboard",
    bgImage: "/hero/hero_keyboard.png",
    titlePrefix: "Aeros",
    titleSuffix: "Keys",
    taglinePrefix: "Explore the ",
    taglineHighlight: "Melody of Sound",
    description: "เริ่มแต่งแต้มโน้ตตัวแรกด้วยคีย์บอร์ดและเครื่องสังเคราะห์เสียงคุณภาพเยี่ยม ใช้งานง่าย ฟังก์ชันครบถ้วน เหมาะสำหรับทั้งการฝึกซ้อมและขึ้นเวทีจริง",
    link: "/products?category=keyboards",
  },
  {
    id: "drum",
    bgImage: "/hero/hero_dump.png",
    titlePrefix: "Vortex",
    titleSuffix: "Percussion",
    taglinePrefix: "Feel the ",
    taglineHighlight: "Power of Rhythm",
    description: "ปลดปล่อยพลังจังหวะในตัวคุณด้วยกลองชุดที่ได้มาตรฐาน ตอบสนองฉับไว แข็งแรงทนทาน ให้เสียงที่หนักแน่นทรงพลังสำหรับทุกก้าวการเรียนรู้",
    link: "/products?category=drums",
  }
];

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        setAnimating(false);
      }, 500); // matches transition fade-out duration
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleDotClick = (index: number) => {
    if (index !== activeIndex && !animating) {
      setAnimating(true);
      setTimeout(() => {
        setActiveIndex(index);
        setAnimating(false);
      }, 500);
    }
  };

  const activeSlide = (slides[activeIndex] || slides[0]) as Slide;

  return (
    <section className="relative h-[calc(105vh-80px)] flex items-center overflow-hidden bg-neutral-950 py-8">
      {/* Background Hero Images with Cross-Fade */}
      <div className="absolute inset-0 z-0 h-full w-full">
        {slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.bgImage}
            alt={slide.titlePrefix}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-right md:object-center select-none pointer-events-none transition-opacity duration-1000 ease-in-out",
              activeIndex === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        {/* Soft dark overlay for text contrast */}
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/4 z-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-electric-blue/5 blur-[120px] pointer-events-none" />
      
      <div className="mx-auto w-full max-w-7xl px-6 relative z-10">
        {/* Heading and Text */}
        <div className="flex flex-col gap-6 text-left max-w-3xl">
          {/* Title */}
          <h1 className="font-heading text-5xl font-light tracking-wide text-black sm:text-6xl lg:text-8xl leading-none">
            <span className={cn(
              "inline-block transition-all duration-500 ease-out transform",
              animating ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
            )}>
              {activeSlide.titlePrefix}{" "}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-amber-spotlight">
                {activeSlide.titleSuffix}
              </span>
            </span>
            <span className={cn(
              "block text-lg sm:text-xl lg:text-2xl font-light tracking-[0.12em] text-black/70 mt-6 max-w-xl leading-relaxed uppercase transition-all duration-500 ease-out transform delay-75",
              animating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
            )}>
              {activeSlide.taglinePrefix}
              <span className="text-black font-semibold relative inline-block whitespace-nowrap">
                {activeSlide.taglineHighlight}
                <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-gradient-to-r from-electric-blue to-amber-spotlight" />
              </span>
            </span>
          </h1>

          {/* Description */}
          <p className={cn(
            "text-base text-black/80 sm:text-lg leading-relaxed max-w-lg font-normal mt-2 transition-all duration-500 ease-out transform delay-100",
            animating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
          )}>
            {activeSlide.description}
          </p>

          {/* Call to Actions */}
          <div className={cn(
            "flex flex-wrap gap-4 mt-4 transition-all duration-500 ease-out transform delay-150",
            animating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
          )}>
            <Button
              asChild
              className="h-12 rounded-full bg-orange-500 px-8 text-sm font-semibold text-black hover:bg-orange-500/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35"
            >
              <Link href={activeSlide.link} className="flex items-center gap-2">
                สำรวจรุ่นสินค้า
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-6 md:left-12 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={cn(
              "h-1 rounded-full transition-all duration-500 cursor-pointer",
              activeIndex === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
