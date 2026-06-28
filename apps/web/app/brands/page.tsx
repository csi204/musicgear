"use client";

import Link from "next/link";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { Home, ArrowRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface BrandItem {
  id: string;
  name: string;
  slogan: string;
  description: string;
  categories: string[];
  styleClass: string;
}

const brands: BrandItem[] = [
  {
    id: "fender",
    name: "FENDER",
    slogan: "The Spirit of Rock 'n' Roll",
    description: "ตำนานกีต้าร์ไฟฟ้าและแอมป์ระดับโลกผู้ให้กำเนิดแนวเพลงสมัยใหม่มาตั้งแต่ปี 1946",
    categories: ["Guitars & Basses"],
    styleClass: "font-serif tracking-normal text-neutral-800 hover:text-amber-600",
  },
  {
    id: "gibson",
    name: "GIBSON",
    slogan: "The Choice of Legends",
    description: "งานฝีมือสุดประณีตจากสหรัฐอเมริกา สัญลักษณ์แห่งความคลาสสิกและโทนเสียงที่อบอุ่นหนาเป็นเอกลักษณ์",
    categories: ["Guitars"],
    styleClass: "font-black tracking-tight text-neutral-900 hover:text-orange-500",
  },
  {
    id: "yamaha",
    name: "YAMAHA",
    slogan: "Make Waves",
    description: "แบรนด์ดนตรีที่ครอบคลุมทุกความต้องการ ตั้งแต่เปียโนระดับคอนเสิร์ต กีต้าร์ ไปจนถึงชุดกลองที่ทนทาน",
    categories: ["Keyboards", "Guitars", "Drums"],
    styleClass: "font-sans font-semibold tracking-wider text-blue-900 hover:text-blue-700",
  },
  {
    id: "roland",
    name: "ROLAND",
    slogan: "Inspiring the Future of Music",
    description: "ผู้นำเทคโนโลยีคีย์บอร์ดไฟฟ้า ซินธิไซเซอร์ และกลองไฟฟ้า V-Drums ที่ปฏิวัติวงการดนตรีอิเล็กทรอนิกส์",
    categories: ["Keyboards", "Drums"],
    styleClass: "font-mono font-bold tracking-widest text-neutral-900 hover:text-orange-600",
  },
  {
    id: "nord",
    name: "NORD",
    slogan: "Handmade in Sweden",
    description: "คีย์บอร์ดสีแดงสดอันโดดเด่นบนเวทีคอนเสิร์ตทั่วโลก ได้รับการออกแบบและประกอบด้วยมือเพื่อนักดนตรีอาชีพ",
    categories: ["Keyboards"],
    styleClass: "font-sans font-black tracking-tighter text-red-600 hover:text-red-500",
  },
  {
    id: "ibanez",
    name: "IBANEZ",
    slogan: "Designed for Speed & Style",
    description: "กีต้าร์สำหรับสายเทคนิคอลและร็อคยุคใหม่ คอที่บางเฉียบและการตอบสนองที่รวดเร็วเพื่อการเล่นอย่างไร้ขีดจำกัด",
    categories: ["Guitars"],
    styleClass: "font-serif italic font-extrabold tracking-normal text-neutral-800 hover:text-yellow-600",
  },
  {
    id: "korg",
    name: "KORG",
    slogan: "Innovating Sound and Performance",
    description: "ผู้สร้างสรรค์ซินธิไซเซอร์ คีย์บอร์ดซีเควนเซอร์ และจูนเนอร์คุณภาพสูงที่นักออกแบบเสียงระดับโลกไว้วางใจ",
    categories: ["Keyboards"],
    styleClass: "font-sans font-bold tracking-tight text-neutral-950 hover:text-neutral-700",
  },
  {
    id: "epiphone",
    name: "EPIPHONE",
    slogan: "Classic Heritage, Modern Value",
    description: "ประวัติศาสตร์ยาวนานกว่า 150 ปี นำเสนอรูปทรงและเสียงระดับ Gibson ในราคาที่เข้าถึงได้ง่ายขึ้น",
    categories: ["Guitars"],
    styleClass: "font-serif font-bold tracking-normal text-amber-900 hover:text-amber-700",
  },
  {
    id: "taylor",
    name: "TAYLOR",
    slogan: "Acoustic Craftsmanship Redefined",
    description: "มาตรฐานใหม่ของกีต้าร์โปร่ง โดดเด่นด้วยโทนเสียงที่ใสคมชัด คอที่เล่นง่าย และนวัตกรรมการผลิตชั้นเยี่ยม",
    categories: ["Guitars"],
    styleClass: "font-serif font-normal tracking-wide text-neutral-800 hover:text-yellow-700",
  },
  {
    id: "martin",
    name: "MARTIN",
    slogan: "The Original Acoustic Tone",
    description: "ผู้บุกเบิกและสร้างมาตรฐานกีต้าร์ทรง Dreadnought กลิ่นอายของเสียงวินเทจที่เป็นมาตรฐานอุตสาหกรรมเพลง",
    categories: ["Guitars"],
    styleClass: "font-serif tracking-widest text-neutral-900 hover:text-amber-800",
  },
  {
    id: "prs",
    name: "PRS GUITARS",
    slogan: "Uncompromised Precision & Luxury",
    description: "Paul Reed Smith กีต้าร์ระดับไฮเอนด์ที่ผสานระหว่างความงามของลายไม้คุณภาพยอดเยี่ยมและเสียงที่หลากหลาย",
    categories: ["Guitars"],
    styleClass: "font-serif font-black tracking-normal text-stone-800 hover:text-stone-600",
  },
  {
    id: "pearl",
    name: "PEARL DRUMS",
    slogan: "The Best Reason to Play Drums",
    description: "แบรนด์กลองและฮาร์ดแวร์อันดับหนึ่งจากญี่ปุ่น ทนทาน ทรงพลัง และให้เสียงที่เป็นแกนหลักในทุกเวทีคอนเสิร์ต",
    categories: ["Drums"],
    styleClass: "font-sans font-black italic tracking-widest text-neutral-900 hover:text-orange-500",
  },
  {
    id: "tama",
    name: "TAMA DRUMS",
    slogan: "Strongest Name in Drums",
    description: "กลองชุดสุดแกร่งขวัญใจมือกลองสายเฮฟวี่และร็อค ขึ้นชื่อเรื่องความหนักแน่นและความมั่นคงของโครงสร้าง",
    categories: ["Drums"],
    styleClass: "font-sans font-extrabold tracking-normal text-red-700 hover:text-red-600",
  },
  {
    id: "alesis",
    name: "ALESIS",
    slogan: "Electronic Percussion Leaders",
    description: "นวัตกรรมกลองไฟฟ้าสำหรับซ้อมมือและบันทึกเสียงในสตูดิโอ อัดแน่นด้วยเทคโนโลยีและเสียงตัวอย่างที่หลากหลาย",
    categories: ["Drums"],
    styleClass: "font-mono font-bold tracking-tight text-neutral-800 hover:text-blue-600",
  },
  {
    id: "focusrite",
    name: "FOCUSRITE",
    slogan: "Studio Sound, Anywhere",
    description: "ออดิโออินเตอร์เฟสซีรีส์ Scarlett สีแดงระดับไอคอนที่ได้รับความนิยมมากที่สุดในโลกสำหรับโฮมสตูดิโอ",
    categories: ["Pro Audio"],
    styleClass: "font-sans font-black tracking-normal text-red-600 hover:text-red-500",
  },
  {
    id: "shure",
    name: "SHURE",
    slogan: "Legendary Performance Microphones",
    description: "ผู้ผลิตไมโครโฟนระดับตำนานอย่าง SM58 และ SM7B มาตรฐานสากลสำหรับนักร้อง พ็อดคาสเตอร์ และโปรดิวเซอร์",
    categories: ["Pro Audio"],
    styleClass: "font-sans font-extrabold tracking-widest text-neutral-900 hover:text-neutral-600",
  },
];

export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      {/* Header / Navigation bar */}
      <Navbar />

      {/* Main page content wrapper */}
      <main className="flex-grow">
        
        {/* Banner with dark theme for premium feeling */}
        <div className="relative h-[320px] overflow-hidden rounded-b-[40px] md:rounded-b-[50px] bg-neutral-950">
          <img
            src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80"
            alt="Brands Collection Banner"
            className="absolute inset-0 h-full w-full object-cover brightness-[0.4] saturate-[0.8]"
          />
          {/* Subtle radial dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-900/40 to-transparent" />
          
          {/* Banner Content Container */}
          <div className="relative z-10 mx-auto max-w-7xl h-full px-6 flex flex-col justify-end pb-10">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-400 uppercase font-heading mb-3">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
              </Link>
              <span className="text-neutral-600">/</span>
              <span className="text-white">Brands</span>
            </div>

            {/* Heading */}
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
              Explore Our Brands • แบรนด์เครื่องดนตรีชั้นนำ
            </h1>
          </div>
        </div>

        {/* Brand Curation Message */}
        <div className="mx-auto max-w-7xl px-6 py-12 text-center sm:text-left">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl mb-3">
              แบรนด์ระดับตำนานที่เราคัดสรร
            </h2>
            <p className="text-sm sm:text-base text-slate-gray leading-relaxed">
              เราเป็นตัวแทนจำหน่ายอย่างเป็นทางการของแบรนด์เครื่องดนตรีชั้นนำทั่วโลก 
              มั่นใจในคุณภาพและบริการหลังการขายด้วยมาตรฐานระดับสากล 
              เลือกแบรนด์ที่ชอบเพื่อค้นหาเครื่องดนตรีคู่ใจของคุณ
            </p>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="bg-white/80 backdrop-blur-sm py-12 border-t border-[#E5E2DA]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.id}`}
                  className="group relative flex flex-col justify-between p-8 rounded-3xl border border-[#E5E2DA] bg-warm-offwhite/30 overflow-hidden transition-all duration-300 hover:border-electric-blue/30 hover:bg-white hover:shadow-[0_15px_35px_rgba(47,93,255,0.06)]"
                >
                  <div className="flex flex-col gap-4">
                    {/* Brand Name with unique font styles */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-2xl md:text-3xl transition-colors duration-300", brand.styleClass)}>
                        {brand.name}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-400 group-hover:bg-electric-blue group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                    
                    {/* Slogan */}
                    {brand.slogan && (
                      <span className="text-[10px] font-bold tracking-widest text-amber-spotlight uppercase font-heading">
                        {brand.slogan}
                      </span>
                    )}

                    {/* Thai description */}
                    <p className="text-xs text-slate-gray leading-relaxed max-w-md">
                      {brand.description}
                    </p>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-[#E5E2DA]/50">
                    {brand.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[9px] font-bold tracking-wider text-slate-gray bg-[#F5F3EE] px-2.5 py-1 rounded-full uppercase"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
