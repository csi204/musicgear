"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Star, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Check, 
  Home, 
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getProductById, Product } from "../../../lib/products-data";
import { getApiBaseUrl } from "../../../lib/auth";
import { useCart } from "../../../hooks/useCart";

interface ProductDetailClientProps {
  /** Slug-like ID used for mock lookup. In production: product slug from URL → GET /products/by-slug/:slug */
  productSlug: string;
}

export function ProductDetailClient({ productSlug }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, addMultipleItems } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`${getApiBaseUrl()}/products/by-slug/${productSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ok" && data.product) {
            const p = data.product;
            setProduct({
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
                { label: "Level", value: p.skillLevel || "All Levels" }
              ],
              imagesGallery: p.images && p.images.length > 0
                ? p.images.map((img: any) => `${getApiBaseUrl()}/products/images/${img.imageUrl}`)
                : [],
              accessories: [],
              comparisons: []
            } as any);
          } else {
            const fallback = getProductById(productSlug);
            if (fallback) setProduct(fallback);
          }
        } else {
          const fallback = getProductById(productSlug);
          if (fallback) setProduct(fallback);
        }
      } catch (err) {
        console.error("Failed to fetch product by slug:", err);
        const fallback = getProductById(productSlug);
        if (fallback) setProduct(fallback);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productSlug]);

  // Selected Options States
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");
  
  // Bundle Selection States
  const [includeMain, setIncludeMain] = useState(true);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [bundleAdded, setBundleAdded] = useState(false);
  const [itemAdded, setItemAdded] = useState(false);

  useEffect(() => {
    if (product) {
      const firstColor = product.colors[0];
      if (firstColor) {
        setSelectedColor(firstColor.name);
      }
      setActiveImage(product.imageUrl);
      
      // Default all accessories to checked
      if (product.accessories) {
        setSelectedAccessories(product.accessories.map(acc => acc.id));
      }
    }
  }, [product]);

  // Update image when color changes
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    if (product?.imagesByColor?.[colorName]) {
      setActiveImage(product.imagesByColor[colorName]);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-slate-gray font-medium">
        กำลังโหลดรายละเอียดสินค้า...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="font-heading text-3xl font-bold mb-4">ไม่พบสินค้าที่คุณกำลังมองหา</h2>
        <p className="text-slate-gray mb-8">สินค้าอาจถูกถอดออกจากระบบ หรือที่อยู่ URL ไม่ถูกต้อง</p>
        <Link 
          href="/products" 
          className="inline-flex items-center justify-center rounded-full bg-electric-blue text-white px-6 py-3 font-semibold hover:bg-electric-blue/90 transition-all"
        >
          กลับสู่หน้ารายการสินค้า
        </Link>
      </div>
    );
  }

  // Calculate pricing
  const hasDiscount = !!product.originalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Bundle calculations
  const accessoriesList = product.accessories || [];
  const selectedAccessoriesData = accessoriesList.filter(acc => selectedAccessories.includes(acc.id));
  
  const mainProductPrice = includeMain ? product.price : 0;
  const accessoriesPrice = selectedAccessoriesData.reduce((sum, acc) => sum + acc.price, 0);
  const totalBundlePrice = mainProductPrice + accessoriesPrice;

  // Add single item to cart
  const handleAddToCart = () => {
    addItem({
      productId: product.productId || product.id,
      title: product.title,
      price: product.price,
      quantity: quantity,
      color: selectedColor || "Default",
      imageUrl: activeImage || product.imageUrl,
      brand: product.brand
    });
    setItemAdded(true);
    setTimeout(() => setItemAdded(false), 2000);
  };

  // Add bundle to cart
  const handleAddBundleToCart = () => {
    const itemsToAdd = [];
    
    if (includeMain) {
      itemsToAdd.push({
        productId: product.productId || product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        color: selectedColor || "Default",
        imageUrl: activeImage || product.imageUrl,
        brand: product.brand
      });
    }

    selectedAccessoriesData.forEach(acc => {
      itemsToAdd.push({
        productId: acc.id,
        title: acc.title,
        price: acc.price,
        quantity: 1,
        color: "Default",
        imageUrl: acc.imageUrl,
        brand: "ACCESSORY"
      });
    });

    if (itemsToAdd.length > 0) {
      addMultipleItems(itemsToAdd);
      setBundleAdded(true);
      setTimeout(() => setBundleAdded(false), 2500);
    }
  };

  const toggleAccessory = (accId: string) => {
    setSelectedAccessories(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  // Determine category for breadcrumb (uses slug string matching for mock data)
  let categoryName = "กีต้าร์";
  let categoryLink = "/products?category=guitars";
  if (productSlug.includes("keyboard") || productSlug.includes("roland-juno") || productSlug.includes("korg") || productSlug.includes("nord")) {
    categoryName = "คีย์บอร์ด & เปียโน";
    categoryLink = "/products?category=keyboards";
  } else if (productSlug.includes("drum") || productSlug.includes("pearl") || productSlug.includes("tama") || productSlug.includes("alesis")) {
    categoryName = "กลองชุด & อุปกรณ์";
    categoryLink = "/products?category=drums";
  } else if (productSlug.includes("focusrite") || productSlug.includes("shure")) {
    categoryName = "เครื่องเสียงโปร & สตูดิโอ";
    categoryLink = "/products?category=pro-audio";
  }

  // Generate rating stars helper
  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-4 w-4 text-neutral-300" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-neutral-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="py-8 bg-[#F5F3EE]/30">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-gray uppercase mb-8">
          <Link href="/" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <span className="text-neutral-400 font-normal">/</span>
          <Link href={categoryLink} className="hover:text-neutral-900 transition-colors">
            {categoryName}
          </Link>
          <span className="text-neutral-400 font-normal">/</span>
          <span className="text-neutral-800 font-bold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </div>

        {/* Top Split Section: Gallery & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-3xl border border-[#E5E2DA] p-6 sm:p-8 mb-12 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          
          {/* Gallery Area (Left) - ColSpan 7 */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
            
            {/* Vertical Thumbnails Stack (Left of main photo) */}
            <div className="order-2 md:order-1 flex md:flex-col gap-3 min-w-[80px]">
              {product.imagesGallery.map((imgUrl, idx) => {
                const isActive = activeImage === imgUrl;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={cn(
                      "relative h-20 w-20 rounded-xl border bg-[#F5F3EE]/25 p-2 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200",
                      isActive ? "border-electric-blue ring-1 ring-electric-blue bg-white" : "border-[#E5E2DA] hover:border-neutral-400"
                    )}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Product Showcase Box (Right of thumbnails) */}
            <div className="order-1 md:order-2 flex-grow aspect-[4/3] rounded-2xl border border-[#E5E2DA] bg-[#F5F3EE]/15 flex items-center justify-center p-6 relative overflow-hidden">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out hover:scale-105"
                />
              ) : null}
              {hasDiscount && (
                <span className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Save {discountPercentage}%
                </span>
              )}
            </div>

          </div>

          {/* Details Area (Right) - ColSpan 5 */}
          <div className="lg:col-span-5 flex flex-col justify-between text-left">
            <div>
              {/* Brand and Stock Status */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[10px] font-bold tracking-widest text-slate-gray uppercase font-heading">
                  {product.brand}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {product.stockStatus}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-neutral-950 mb-3 tracking-tight leading-tight">
                {product.title}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {renderStars(product.rating)}
                </div>
                <span className="text-xs font-bold text-neutral-800">{product.rating}</span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-slate-gray hover:underline cursor-pointer">({product.reviewsCount} รีวิวจากผู้ใช้)</span>
              </div>

              {/* Price & Discounts */}
              <div className="flex items-baseline gap-3 mb-6 p-4 rounded-2xl bg-[#F5F3EE]/30 border border-[#E5E2DA]/50">
                <span className={cn(
                  "text-3xl font-bold font-heading",
                  hasDiscount ? "text-red-500" : "text-neutral-950"
                )}>
                  {product.price.toLocaleString()} ฿
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-slate-gray line-through font-medium">
                      {product.originalPrice!.toLocaleString()} ฿
                    </span>
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                      ประหยัด {(product.originalPrice! - product.price).toLocaleString()} ฿
                    </span>
                  </>
                )}
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-slate-gray leading-relaxed mb-6">
                {product.descriptionLong.slice(0, 160)}...
              </p>

              {/* Options Divider */}
              <div className="border-t border-[#E5E2DA] my-6" />

              {/* Color Selection (Swatches) */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <span className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5">
                    เลือกสี: <span className="text-neutral-500 normal-case font-medium">{selectedColor}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    {product.colors.map((color) => {
                      const isActive = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          onClick={() => handleColorChange(color.name)}
                          title={color.name}
                          className={cn(
                            "h-7 w-7 rounded-full border border-neutral-300 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center",
                            isActive ? "ring-2 ring-offset-2 ring-electric-blue border-transparent scale-105" : ""
                          )}
                          style={{ background: color.hex }}
                        >
                          {isActive && <Check className="h-3.5 w-3.5 text-white filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-8">
                <span className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5">
                  จำนวน
                </span>
                <div className="inline-flex items-center rounded-full border border-[#DEDCD4] bg-white p-1">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-[#F5F3EE] transition-all cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-neutral-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-[#F5F3EE] transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons & Badges */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={handleAddToCart}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-full font-bold text-sm tracking-wide shadow-sm transition-all cursor-pointer active:scale-95",
                    itemAdded 
                      ? "bg-emerald-600 text-white hover:bg-emerald-600" 
                      : "bg-electric-blue text-white hover:bg-electric-blue/90"
                  )}
                >
                  {itemAdded ? (
                    <>
                      <Check className="h-4.5 w-4.5" />
                      เพิ่มลงตะกร้าแล้ว
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4.5 w-4.5" />
                      ใส่ตะกร้าสินค้า
                    </>
                  )}
                </button>
                
                <button className="flex h-12 items-center justify-center rounded-full border border-neutral-800 bg-white font-bold text-sm text-neutral-800 tracking-wide hover:bg-neutral-50 transition-all cursor-pointer active:scale-95">
                  ซื้อทันที (Buy Now)
                </button>
              </div>

              {/* Delivery and Warranty Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="flex items-center gap-3 rounded-2xl border border-[#E5E2DA]/80 bg-[#F5F3EE]/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-neutral-900 leading-tight">จัดส่งฟรีทั่วประเทศ</h4>
                    <p className="text-[10px] text-slate-gray mt-0.5">เมื่อมียอดสั่งซื้อ 1,500 ฿ ขึ้นไป</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#E5E2DA]/80 bg-[#F5F3EE]/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-neutral-900 leading-tight">ประกันศูนย์ 2 ปีเต็ม</h4>
                    <p className="text-[10px] text-slate-gray mt-0.5">ดูแลความชำรุดจากการผลิต 100%</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mid Section: Tabs (Description, Specifications, Reviews) */}
        <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 sm:p-8 mb-12 shadow-[0_10px_30px_rgba(0,0,0,0.01)] text-left">
          {/* Tab Headers */}
          <div className="flex border-b border-[#E5E2DA] mb-6">
            <button
              onClick={() => setActiveTab("description")}
              className={cn(
                "pb-4 px-6 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer",
                activeTab === "description" 
                  ? "border-electric-blue text-electric-blue" 
                  : "border-transparent text-slate-gray hover:text-neutral-900"
              )}
            >
              Description (คำอธิบาย)
            </button>
            <button
              onClick={() => setActiveTab("specifications")}
              className={cn(
                "pb-4 px-6 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer",
                activeTab === "specifications" 
                  ? "border-electric-blue text-electric-blue" 
                  : "border-transparent text-slate-gray hover:text-neutral-900"
              )}
            >
              Specifications (สเปกเทคนิค)
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "pb-4 px-6 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all cursor-pointer",
                activeTab === "reviews" 
                  ? "border-electric-blue text-electric-blue" 
                  : "border-transparent text-slate-gray hover:text-neutral-900"
              )}
            >
              Reviews (รีวิวสินค้า)
            </button>
          </div>

          {/* Tab Contents */}
          <div className="min-h-[150px]">
            {activeTab === "description" && (
              <div className="space-y-4">
                <h3 className="font-heading text-lg font-bold text-neutral-950">คำอธิบายรายละเอียดผลิตภัณฑ์</h3>
                <p className="text-sm text-slate-gray leading-relaxed">{product.descriptionLong}</p>
                <p className="text-sm text-slate-gray leading-relaxed">
                  ทางทีมงาน MusicGear คัดสรรเฉพาะแบรนด์และรุ่นที่ตอบสนองความจำเป็นของนักดนตรีบนเวทีจริง ไม่ว่าจะเป็นงานซ้อมไปจนถึงคอนเสิร์ตใหญ่ สินค้าทุกชิ้นผ่านการตรวจสอบคุณภาพเสียง สภาพฮาร์ดแวร์ และเซ็ตอัพคอ/ทัชชิ่งจากช่างผู้เชี่ยวชาญก่อนจัดส่ง เพื่อให้มั่นใจได้ว่า Gear ของคุณพร้อมลุยตั้งแต่แกะกล่องทันที
                </p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                <h3 className="font-heading text-lg font-bold text-neutral-950 mb-4">ข้อมูลจำเพาะทางเทคนิค (Technical Specifications)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="flex py-2 border-b border-[#F5F3EE] justify-between text-sm">
                      <span className="font-semibold text-neutral-800">{spec.label}</span>
                      <span className="text-slate-gray font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-[#F5F3EE]/30 border border-[#E5E2DA] max-w-md">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold font-heading text-neutral-950">{product.rating}</span>
                    <span className="text-xs text-slate-gray block mt-1">จาก 5.0 คะแนน</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {renderStars(product.rating)}
                    </div>
                    <p className="text-xs text-slate-gray font-medium">มีรีวิวที่เขียนแนะนำจริง {product.reviewsCount} รายการ ลูกค้าส่วนใหญ่พอใจในคุณภาพเสียงและความทนทานของวัสดุ</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#F5F3EE]">
                  <div className="p-4 rounded-xl border border-neutral-100 bg-[#F5F3EE]/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-neutral-900">คุณภาณุพงศ์ อ.</h5>
                        <div className="flex items-center mt-1">{renderStars(5)}</div>
                      </div>
                      <span className="text-[10px] text-slate-gray">2 อาทิตย์ที่แล้ว</span>
                    </div>
                    <p className="text-xs text-slate-gray">เสียงดีเกินราคามากครับ คอจับง่ายมือ สัมผัสดีงามมาก การเซ็ตอัพมาจากร้านทำได้ยอดเยี่ยม ไม่ต้องปรับทัชชิ่งเพิ่มเลย เสียบเล่นกับแอมป์เสียงเคลียร์สุดยอด แนะนำแบรนด์นี้เลยครับ</p>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-100 bg-[#F5F3EE]/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-neutral-900">คุณวรรณรักษ์ ม.</h5>
                        <div className="flex items-center mt-1">{renderStars(4.5)}</div>
                      </div>
                      <span className="text-[10px] text-slate-gray">1 เดือนที่แล้ว</span>
                    </div>
                    <p className="text-xs text-slate-gray">ส่งของไวมากครับ แพ็คมาแน่นหนาดี ตัวจริงสวย ลายไม้สวยงามมาก สุ่มเสียงก็กว้างพุ่งชัดดี โดยเฉพาะตัวเลือกสีสวยงามสะดุดตา เสียอย่างเดียวกระเป๋าแถมบางไปนิด แต่คุ้มราคาที่สุดในตลาดแล้วครับ</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frequently Bought Together (Bundle Picker) */}
        {accessoriesList.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 sm:p-8 mb-12 shadow-[0_10px_30px_rgba(0,0,0,0.01)] text-left">
            <h3 className="font-heading text-lg font-bold text-neutral-950 mb-6"> Frequently Bought Together (เซ็ตที่มักจะซื้อร่วมกัน) </h3>
            
            <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
              
              {/* Product Cards Row with Connectors */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center lg:justify-start">
                
                {/* Main Product Card */}
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border bg-white min-w-[240px] sm:min-w-[280px] transition-all",
                  includeMain ? "border-electric-blue/40 shadow-sm" : "border-neutral-200 opacity-60"
                )}>
                  <input
                    type="checkbox"
                    checked={includeMain}
                    onChange={(e) => setIncludeMain(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-electric-blue focus:ring-electric-blue cursor-pointer"
                    id="bundle-main"
                  />
                  <div className="h-14 w-14 rounded-lg bg-[#F5F3EE]/30 border border-[#E5E2DA] flex items-center justify-center p-1.5">
                    <img src={product.imageUrl} alt={product.title} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{product.title}</h4>
                    <span className="text-xs font-bold text-neutral-950 mt-0.5 block">{product.price.toLocaleString()} ฿</span>
                  </div>
                </div>

                {accessoriesList.map((acc, idx) => {
                  const isChecked = selectedAccessories.includes(acc.id);
                  return (
                    <div key={acc.id} className="flex items-center gap-4 sm:gap-6">
                      <span className="text-xl font-medium text-neutral-400 font-heading">+</span>
                      
                      <div className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border bg-white min-w-[240px] sm:min-w-[280px] transition-all",
                        isChecked ? "border-electric-blue/40 shadow-sm" : "border-neutral-200 opacity-60"
                      )}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAccessory(acc.id)}
                          className="h-4.5 w-4.5 rounded text-electric-blue focus:ring-electric-blue cursor-pointer"
                          id={`bundle-${acc.id}`}
                        />
                        <div className="h-14 w-14 rounded-lg bg-[#F5F3EE]/30 border border-[#E5E2DA] flex items-center justify-center p-1.5">
                          <img src={acc.imageUrl} alt={acc.title} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{acc.title}</h4>
                          <span className="text-xs font-bold text-neutral-950 mt-0.5 block">{acc.price.toLocaleString()} ฿</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Total Calculation & Action Box */}
              <div className="w-full lg:w-auto min-w-[220px] rounded-2xl bg-[#F5F3EE]/40 border border-[#E5E2DA]/85 p-6 flex flex-col items-center lg:items-end justify-center text-center lg:text-right">
                <span className="text-xs text-slate-gray font-medium">ราคารวมทั้งเซ็ต:</span>
                <span className="text-2xl font-extrabold font-heading text-neutral-950 mt-1 mb-4">{totalBundlePrice.toLocaleString()} ฿</span>
                
                <button
                  onClick={handleAddBundleToCart}
                  disabled={!includeMain && selectedAccessories.length === 0}
                  className={cn(
                    "w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-full font-bold text-xs tracking-wider px-6 py-3 transition-all cursor-pointer active:scale-95 shadow-sm uppercase",
                    bundleAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {bundleAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      เพิ่มเซ็ตลงตะกร้าแล้ว
                    </>
                  ) : (
                    "หยิบทั้งเซ็ตใส่ตะกร้า"
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Compare with similar items Section */}
        {product.comparisons.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 sm:p-8 mb-12 shadow-[0_10px_30px_rgba(0,0,0,0.01)] text-left overflow-hidden">
            <h3 className="font-heading text-lg font-bold text-neutral-950 mb-6">Compare with similar items (เปรียบเทียบกับสินค้าใกล้เคียง)</h3>
            
            {/* Table wrapper for mobile scrolling */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E5E2DA]">
                    <th className="py-4 text-left font-bold text-xs text-slate-gray uppercase tracking-wider w-1/4">Feature</th>
                    {product.comparisons.map((item, idx) => (
                      <th 
                        key={idx} 
                        className={cn(
                          "py-4 px-6 text-left font-bold text-sm font-heading tracking-wide",
                          idx === 0 ? "text-electric-blue uppercase" : "text-neutral-900"
                        )}
                      >
                        {item.name}
                        {idx === 0 && <span className="block text-[9px] text-slate-gray font-normal normal-case font-sans mt-0.5">(รุ่นที่คุณเลือก)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F3EE]">
                  
                  {/* Price Row */}
                  <tr>
                    <td className="py-4 font-semibold text-neutral-800">Price (ราคา)</td>
                    {product.comparisons.map((item, idx) => (
                      <td 
                        key={idx} 
                        className={cn(
                          "py-4 px-6 font-bold font-heading text-sm",
                          idx === 0 ? "text-red-500" : "text-neutral-950"
                        )}
                      >
                        {item.price.toLocaleString()} ฿
                      </td>
                    ))}
                  </tr>

                  {/* Body Style Row */}
                  <tr>
                    <td className="py-4 font-semibold text-neutral-800">Body Style / Type</td>
                    {product.comparisons.map((item, idx) => (
                      <td key={idx} className="py-4 px-6 text-slate-gray font-medium">
                        {item.bodyStyle}
                      </td>
                    ))}
                  </tr>

                  {/* Wood Type Row */}
                  <tr>
                    <td className="py-4 font-semibold text-neutral-800">Wood / Base Materials</td>
                    {product.comparisons.map((item, idx) => (
                      <td key={idx} className="py-4 px-6 text-slate-gray font-medium">
                        {item.woodType}
                      </td>
                    ))}
                  </tr>

                  {/* Electronics Row */}
                  <tr>
                    <td className="py-4 font-semibold text-neutral-800">Pickups / Sound Engine</td>
                    {product.comparisons.map((item, idx) => (
                      <td key={idx} className="py-4 px-6 text-slate-gray font-medium">
                        {item.electronics}
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
