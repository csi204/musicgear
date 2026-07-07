/**
 * ============================================================
 * MOCK DATA — UX/UI Development Phase
 * ============================================================
 * ไฟล์นี้เป็น mock data ชั่วคราวสำหรับพัฒนา UX/UI เท่านั้น
 *
 * TODO: [product-svc] Replace entire file with API calls via api-gateway:
 *   - getProducts(filters)  → GET {API_GATEWAY}/products?category=&brand=
 *   - getProductBySlug(slug) → GET {API_GATEWAY}/products/by-slug/:slug
 *
 * TODO: [r2] All imageUrl fields will be replaced with Cloudflare R2 signed URLs
 *
 * IMPORTANT: product.id ใน mock นี้ทำหน้าที่เป็น slug ด้วย
 *   ตอนเชื่อม product-svc จริง ต้องมี field `slug` แยกจาก UUID `id`
 * ============================================================
 */

export interface Product {
  /** In production: UUID from product-svc */
  id: string;
  /** Real UUID primary key from product-svc DB (used for cart/order APIs) */
  productId?: string;
  brand: string;
  title: string;
  price: number;
  originalPrice?: number;
  /** TODO: [r2] Will be Cloudflare R2 signed URL */
  imageUrl: string;
  imagesByColor?: { [color: string]: string };
  colors: { name: string; hex: string }[];
  isBestSeller?: boolean;
  rating: number;
  reviewsCount: number;
  stockStatus: string;
  descriptionLong: string;
  specifications: { label: string; value: string }[];
  /** TODO: [r2] All URLs in this array will be Cloudflare R2 signed URLs */
  imagesGallery: string[];
  accessories: { id: string; title: string; price: number; imageUrl: string }[];
  comparisons: { name: string; price: number; bodyStyle: string; woodType: string; electronics: string }[];
}


export const guitarProducts: Product[] = [
  {
    id: "fender-strat",
    brand: "FENDER",
    title: "Fender Player II Stratocaster HSS",
    price: 28500,
    originalPrice: 32000,
    imageUrl: "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80",
    imagesByColor: {
      "Sunburst": "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80",
      "Black": "https://images.unsplash.com/photo-1598112972545-84372a4f8bc7?auto=format&fit=crop&w=600&q=80",
      "White": "https://images.unsplash.com/photo-1612222869049-d8ec83637a3c?auto=format&fit=crop&w=600&q=80",
    },
    colors: [
      { name: "Sunburst", hex: "linear-gradient(135deg, #a05a2c, #000000)" },
      { name: "Black", hex: "#18181b" },
      { name: "White", hex: "#f4f4f5" },
    ],
    rating: 4.8,
    reviewsCount: 124,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Fender Player II Stratocaster HSS นำโทนเสียงและดีไซน์ระดับคลาสสิกของ Fender มาปรับปรุงใหม่เพื่อตอบสนองนักดนตรียุคปัจจุบัน ด้วยบอดี้ไม้ Alder, คอไม้ Maple รูปทรง Modern C และผิวสัมผัสแบบ Satin ที่เล่นง่ายเป็นพิเศษ มาพร้อมปิ๊กอัพแบบ HSS (Humbucker ที่ตำแหน่งบริดจ์ และ Single-coil สองตำแหน่ง) ที่พร้อมจะปลดปล่อยพลังเสียงในทุกประเภทแนวเพลง",
    specifications: [
      { label: "Body Wood", value: "Alder" },
      { label: "Neck Material", value: "Maple" },
      { label: "Scale Length", value: "25.5\" (64.77 cm)" },
      { label: "Fingerboard Radius", value: "9.5\" (241 mm)" },
      { label: "Number of Frets", value: "22 Medium Jumbo" },
      { label: "Bridge Pickup", value: "Player Series Alnico 2 Humbucking" },
      { label: "Middle & Neck Pickup", value: "Player Series Alnico 5 Strat Single-Coil" },
      { label: "Controls", value: "Master Volume, Tone 1, Tone 2, 5-Position Switch" },
    ],
    imagesGallery: [
      "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1598112972545-84372a4f8bc7?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1612222869049-d8ec83637a3c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1605020422156-205573a53368?auto=format&fit=crop&w=600&q=80",
    ],
    accessories: [
      { id: "folding-stand", title: "MusicGear Folding Guitar Stand", price: 650, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "clip-on-tuner", title: "MusicGear Clip-on Digital Tuner", price: 490, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Fender Player II Stratocaster HSS", price: 28500, bodyStyle: "Stratocaster", woodType: "Alder / Maple", electronics: "Alnico HSS Pickups" },
      { name: "Squier Classic Vibe 60s Strat", price: 16900, bodyStyle: "Stratocaster", woodType: "Nato / Maple", electronics: "Alnico Single-Coil SSS" },
      { name: "PRS SE Custom 24 Guitar", price: 31500, bodyStyle: "Double Cutaway", woodType: "Mahogany / Maple Veneer", electronics: "PRS 85/15 \"S\" Humbuckers" },
    ],
  },
  {
    id: "gibson-lp",
    brand: "GIBSON",
    title: "Gibson Les Paul Standard 60s",
    price: 89000,
    imageUrl: "https://images.unsplash.com/photo-1564186763535-ebb21ec52f44?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Cherry Sunburst", hex: "linear-gradient(135deg, #ef4444, #f59e0b)" },
      { name: "Goldtop", hex: "#d4af37" },
    ],
    rating: 4.9,
    reviewsCount: 88,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Gibson Les Paul Standard 60s คืนชีพการออกแบบระดับตำนานที่นิยามแนวเสียงร็อคและบูลส์ บอดี้ทำจากไม้ Solid Mahogany ปิดผิวหน้าด้วยไม้แกะสลัก AA Figured Maple พร้อมคอ SlimTaper สไตล์ยุค 60s และปิ๊กอัพ Burstbucker 61R/61T คู่อันเป็นเอกลักษณ์เพื่อให้เสียงร้องและคลีนที่หอมหวานเหนือกาลเวลา",
    specifications: [
      { label: "Body Wood", value: "Solid Mahogany w/ AA Figured Maple Top" },
      { label: "Neck Material", value: "Mahogany (SlimTaper profile)" },
      { label: "Scale Length", value: "24.75\" (62.865 cm)" },
      { label: "Fingerboard Radius", value: "12\" (304.8 mm)" },
      { label: "Number of Frets", value: "22 Medium Jumbo" },
      { label: "Pickups", value: "Burstbucker 61R (Neck), Burstbucker 61T (Bridge)" },
      { label: "Controls", value: "2 Volumes, 2 Tones, Hand-wired with Orange Drop Capacitors" },
    ],
    imagesGallery: [
      "https://images.unsplash.com/photo-1564186763535-ebb21ec52f44?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1525201548982-be34add37b4f?auto=format&fit=crop&w=600&q=80",
    ],
    accessories: [
      { id: "premium-strap", title: "Gibson Premium Leather Strap", price: 1800, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "guitar-polish", title: "Gibson Pump Polish & Cloth Kit", price: 450, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Gibson Les Paul Standard 60s", price: 89000, bodyStyle: "Les Paul Single Cut", woodType: "Mahogany / Maple Top", electronics: "Burstbucker 61 Humbuckers" },
      { name: "Epiphone Les Paul Standard 60s", price: 23900, bodyStyle: "Les Paul Single Cut", woodType: "Mahogany / Flame Maple Veneer", electronics: "ProBucker-2 & 3 Humbuckers" },
      { name: "PRS SE Custom 24 Guitar", price: 31500, bodyStyle: "Double Cutaway", woodType: "Mahogany / Maple Veneer", electronics: "PRS 85/15 \"S\" Humbuckers" },
    ],
  },
  {
    id: "ibanez-rg",
    brand: "IBANEZ",
    title: "Ibanez RG550 Genesis Collection",
    price: 37900,
    originalPrice: 41000,
    imageUrl: "https://images.unsplash.com/photo-1525201548982-be34add37b4f?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Road Flare Red", hex: "#e11d48" },
      { name: "Desert Sun Yellow", hex: "#eab308" },
    ],
    rating: 4.7,
    reviewsCount: 62,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Ibanez RG550 นำโมเดลยอดฮิตตลอดกาลจากยุค 1987 กลับมาผลิตอีกครั้งในซีรีส์ Genesis Collection เมดอินเจแปนเพื่อความเนี๊ยบสูงสุด มาพร้อมคอแบบ Super Wizard 5 ชิ้น Maple/Walnut ที่บางเฉียบเล่นได้พริ้วไหวสูงสุด ปิ๊กอัพสไตล์ HSH และคันโยก Edge Tremolo ระดับตำนานที่ให้เสถียรภาพเสียงที่ดีเยี่ยม",
    specifications: [
      { label: "Body Wood", value: "Basswood" },
      { label: "Neck Material", value: "5-piece Maple / Walnut (Super Wizard profile)" },
      { label: "Bridge", value: "Edge Tremolo Bridge" },
      { label: "Pickups", value: "V7 (H) Neck, S1 (S) Middle, V8 (H) Bridge" },
      { label: "Hardware Color", value: "Black" },
    ],
    imagesGallery: [
      "https://images.unsplash.com/photo-1525201548982-be34add37b4f?auto=format&fit=crop&w=600&q=80",
    ],
    accessories: [
      { id: "folding-stand", title: "MusicGear Folding Guitar Stand", price: 650, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "clip-on-tuner", title: "MusicGear Clip-on Digital Tuner", price: 490, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Ibanez RG550 Genesis", price: 37900, bodyStyle: "RG Double Cut", woodType: "Basswood / Maple", electronics: "Ibanez V7/S1/V8 HSH" },
      { name: "Fender Player II Strat HSS", price: 28500, bodyStyle: "Stratocaster", woodType: "Alder / Maple", electronics: "Alnico HSS Pickups" },
      { name: "PRS SE Custom 24 Guitar", price: 31500, bodyStyle: "Double Cutaway", woodType: "Mahogany / Maple Veneer", electronics: "PRS 85/15 \"S\" Humbuckers" },
    ],
  },
  {
    id: "epiphone-casino",
    brand: "EPIPHONE",
    title: "Epiphone Casino Archtop Hollowbody",
    price: 24500,
    originalPrice: 27900,
    imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Vintage Sunburst", hex: "linear-gradient(135deg, #b45309, #18181b)" },
      { name: "Cherry", hex: "#991b1b" },
    ],
    rating: 4.6,
    reviewsCount: 45,
    stockStatus: "Low Stock",
    descriptionLong: "Epiphone Casino กีต้าร์ฮอลโลว์บอดี้แบบเต็มรูปแบบ (True Hollowbody) ที่เป็นตำนานเคียงคู่ศิลปินแนวหน้าอย่าง The Beatles และ Gary Clark Jr. ให้โทนเสียงเปิดกว้าง อบอุ่น และอัดแน่นด้วยคาแรคเตอร์เมื่อผสมผสานกับปิ๊กอัพ Dogear P-90 คลาสสิก",
    specifications: [
      { label: "Body Wood", value: "5-ply Laminated Maple" },
      { label: "Neck Material", value: "Mahogany" },
      { label: "Pickups", value: "2x Dogear P-90T Classic Single-Coils" },
      { label: "Tailpiece", value: "Traditional Trapeze Tailpiece" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "folding-stand", title: "MusicGear Folding Guitar Stand", price: 650, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "clip-on-tuner", title: "MusicGear Clip-on Digital Tuner", price: 490, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Epiphone Casino", price: 24500, bodyStyle: "Archtop Hollowbody", woodType: "Laminated Maple", electronics: "Dogear P-90 Single-Coils" },
      { name: "Fender Player II Strat HSS", price: 28500, bodyStyle: "Stratocaster", woodType: "Alder / Maple", electronics: "Alnico HSS Pickups" },
      { name: "Gibson Les Paul Standard 60s", price: 89000, bodyStyle: "Les Paul Single Cut", woodType: "Mahogany / Maple Top", electronics: "Burstbucker 61 Humbuckers" },
    ],
  },
  {
    id: "taylor-214ce",
    brand: "TAYLOR",
    title: "Taylor 214ce DLX Grand Auditorium",
    price: 49900,
    imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Natural", hex: "#fcedc7" },
      { name: "Tobacco Sunburst", hex: "linear-gradient(135deg, #78350f, #18181b)" },
    ],
    rating: 4.8,
    reviewsCount: 79,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Taylor 214ce DLX ยกระดับกีต้าร์โปร่งไฟฟ้าในซีรีส์ 200 ด้วยผิวสัมผัส Gloss แบบเงาพรีเมียมรอบตัวเรือน พร้อมเคสสไตล์ Hard Shell ดำหรูหรา บอดี้ทรง Grand Auditorium ให้สมดุลเสียงอันยอดเยี่ยม ไม้หน้า Solid Sitka Spruce และไม้ข้าง Rosewood เสริมด้วยปิ๊กอัพ Expression System 2 ที่ส่งสัญญาณอะคูสติกธรรมชาติใสกระจ่างบนเวที",
    specifications: [
      { label: "Body Shape", value: "Grand Auditorium Cutaway" },
      { label: "Top Wood", value: "Solid Sitka Spruce" },
      { label: "Back & Sides", value: "Layered Indian Rosewood" },
      { label: "Electronics", value: "Taylor Expression System 2 (ES2)" },
      { label: "Case Included", value: "Taylor Deluxe Brown Hardshell Case" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "premium-capo", title: "Kyser Quick-Change Guitar Capo", price: 890, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "clip-on-tuner", title: "MusicGear Clip-on Digital Tuner", price: 490, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Taylor 214ce DLX", price: 49900, bodyStyle: "Grand Auditorium", woodType: "Spruce / Rosewood", electronics: "Taylor ES2 Electronics" },
      { name: "Martin D-10E Road Series", price: 35900, bodyStyle: "Dreadnought", woodType: "Sitka Spruce / Sapele", electronics: "Fishman MX-T w/ Tuner" },
      { name: "Yamaha Pacifica 612VIIFM", price: 23900, bodyStyle: "Double Cutaway", woodType: "Alder / Flame Maple", electronics: "Seymour Duncan SSH" },
    ],
  },
  {
    id: "martin-d10e",
    brand: "MARTIN",
    title: "Martin D-10E Road Series Acoustic",
    price: 35900,
    imageUrl: "https://images.unsplash.com/photo-1612222869049-d8ec83637a3c?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Natural", hex: "#fcedc7" },
    ],
    rating: 4.7,
    reviewsCount: 93,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "กีต้าร์โปร่งไฟฟ้าทรง Dreadnought ขนาดเต็มที่ผลิตมาเพื่อนักดนตรีพกพาเดินทางในซีรีส์ Road Series โครงสร้างไม้แท้รอบตัว (Solid Sitka Spruce Top และ Solid Sapele Back/Sides) ให้เสียงทุ้มลึกคำรามอันเป็นมรดกตกทอดของ Martin พร้อมหน้าจอจูนเนอร์ในช่องซาวด์โฮลด้วยระบบ Fishman MX-T",
    specifications: [
      { label: "Body Size", value: "D-14 Fret (Dreadnought)" },
      { label: "Top Wood", value: "Solid Sitka Spruce" },
      { label: "Back & Sides", value: "Solid Sapele" },
      { label: "Electronics", value: "Fishman MX-T Electronics with Soundhole Tuner" },
      { label: "Gig Bag", value: "Martin Premium Soft Shell Case" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1612222869049-d8ec83637a3c?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "premium-capo", title: "Kyser Quick-Change Guitar Capo", price: 890, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "guitar-polish", title: "Gibson Pump Polish & Cloth Kit", price: 450, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Martin D-10E Road Series", price: 35900, bodyStyle: "Dreadnought", woodType: "Sitka Spruce / Sapele", electronics: "Fishman MX-T w/ Tuner" },
      { name: "Taylor 214ce DLX", price: 49900, bodyStyle: "Grand Auditorium", woodType: "Spruce / Rosewood", electronics: "Taylor ES2 Electronics" },
      { name: "Fender Player II Strat HSS", price: 28500, bodyStyle: "Stratocaster", woodType: "Alder / Maple", electronics: "Alnico HSS Pickups" },
    ],
  },
  {
    id: "yamaha-pacifica",
    brand: "YAMAHA",
    title: "Yamaha Pacifica 612VIIFM",
    price: 23900,
    originalPrice: 26500,
    imageUrl: "https://images.unsplash.com/photo-1605020422156-205573a53368?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Indigo Blue", hex: "#1e3a8a" },
      { name: "Root Beer", hex: "#451a03" },
    ],
    rating: 4.8,
    reviewsCount: 112,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Yamaha Pacifica 612VIIFM นำเสิร์ฟสเปกระดับพรีเมียมในราคาสุดคุ้มค่า โครงสร้างไม้เมเปิ้ลลายเปลวไฟประกบคู่บอดี้ไม้ Alder, ฮาร์ดแวร์ Wilkinson, หย่องกราไฟต์ Graphtech และขุมพลังปิ๊กอัพ Seymour Duncan Custom 5 (Bridge) กับ SSL-1 (Neck/Middle) เสียงกว้างสมดุลสูงสุด",
    specifications: [
      { label: "Body Wood", value: "Alder with Flamed Maple Veneer Top" },
      { label: "Neck Material", value: "Maple w/ Satin Finish" },
      { label: "Pickups", value: "Seymour Duncan SSL-1 (Neck & Middle), Seymour Duncan Custom 5 Humbucker (Bridge)" },
      { label: "Bridge", value: "Wilkinson VS50 6 Tremolo" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1605020422156-205573a53368?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "folding-stand", title: "MusicGear Folding Guitar Stand", price: 650, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "clip-on-tuner", title: "MusicGear Clip-on Digital Tuner", price: 490, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Yamaha Pacifica 612VIIFM", price: 23900, bodyStyle: "Double Cutaway", woodType: "Alder / Flame Maple", electronics: "Seymour Duncan SSH" },
      { name: "Fender Player II Strat HSS", price: 28500, bodyStyle: "Stratocaster", woodType: "Alder / Maple", electronics: "Alnico HSS Pickups" },
      { name: "PRS SE Custom 24 Guitar", price: 31500, bodyStyle: "Double Cutaway", woodType: "Mahogany / Maple Veneer", electronics: "PRS 85/15 \"S\" Humbuckers" },
    ],
  },
  {
    id: "prs-se-custom",
    brand: "PRS",
    title: "PRS SE Custom 24 Guitar",
    price: 31500,
    imageUrl: "https://images.unsplash.com/photo-1598112972545-84372a4f8bc7?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Charcoal Cherry Burst", hex: "linear-gradient(135deg, #18181b, #991b1b)" },
      { name: "Faded Blue Burst", hex: "linear-gradient(135deg, #1d4ed8, #a5f3fc)" },
    ],
    rating: 4.9,
    reviewsCount: 142,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "PRS SE Custom 24 นำเสนอรูปทรง คอเล่นง่ายแบบ Wide Thin และการออกแบบที่เป็นเอกลักษณ์ของแบรนด์ระดับหรูอย่าง Paul Reed Smith บอดี้ไม้ Mahogany ปิดหน้าด้วยไม้ Maple แท้และลวดลายแบบเปลวไฟที่สวยงามสะกดใจ ปิ๊กอัพ PRS 85/15 \"S\" สองตำแหน่งที่ปรับแต่งช่วงความถี่ได้อย่างกลมกล่อม",
    specifications: [
      { label: "Body Wood", value: "Mahogany with Maple Top & Flame Maple Veneer" },
      { label: "Neck Material", value: "Maple (Wide Thin neck shape)" },
      { label: "Pickups", value: "PRS 85/15 \"S\" Treble & Bass Humbuckers" },
      { label: "Bridge", value: "PRS Patented Molded Tremolo" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1598112972545-84372a4f8bc7?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "folding-stand", title: "MusicGear Folding Guitar Stand", price: 650, imageUrl: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=150&q=80" },
      { id: "clip-on-tuner", title: "MusicGear Clip-on Digital Tuner", price: 490, imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "PRS SE Custom 24 Guitar", price: 31500, bodyStyle: "Double Cutaway", woodType: "Mahogany / Maple Veneer", electronics: "PRS 85/15 \"S\" Humbuckers" },
      { name: "Fender Player II Strat HSS", price: 28500, bodyStyle: "Stratocaster", woodType: "Alder / Maple", electronics: "Alnico HSS Pickups" },
      { name: "Gibson Les Paul Standard 60s", price: 89000, bodyStyle: "Les Paul Single Cut", woodType: "Mahogany / Maple Top", electronics: "Burstbucker 61 Humbuckers" },
    ],
  },
];

export const keyboardProducts: Product[] = [
  {
    id: "yamaha-p225",
    brand: "YAMAHA",
    title: "Yamaha P-225 B Digital Piano",
    price: 26900,
    originalPrice: 29900,
    imageUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Black", hex: "#18181b" },
      { name: "White", hex: "#f4f4f5" },
    ],
    rating: 4.8,
    reviewsCount: 84,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Yamaha P-225 B เปียโนไฟฟ้าพกพาระดับมืออาชีพที่ได้รับความนิยมอย่างมาก ให้สัมผัสแป้นกดแบบ GHC (Graded Hammer Compact) ที่มีน้ำหนักต้านมือเสมือนเปียโนอะคูสติกจริง มีขนาดบางกะทัดรัด พร้อมความโดดเด่นในระบบเสียง CFX Concert Grand โทนเสียงแกรนด์เปียโนอันหรูหราของทาง Yamaha",
    specifications: [
      { label: "Keys", value: "88-key GHC (Graded Hammer Compact) weighted keyboard" },
      { label: "Tone Generation", value: "Yamaha CFX Grand Piano sound" },
      { label: "Polyphony", value: "192 notes" },
      { label: "Speakers", value: "2x 7W amplifiers with dynamic range" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "sustain-pedal", title: "Yamaha FC4A Sustain Pedal", price: 1800, imageUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=150&q=80" },
      { id: "keyboard-stand", title: "Double-Braced X-Style Stand", price: 990, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Yamaha P-225 B", price: 26900, bodyStyle: "Digital Piano", woodType: "Sleek Compact Plastic", electronics: "CFX Tone Generator" },
      { name: "Roland JUNO-DS61", price: 25500, bodyStyle: "Synthesizer Workstation", woodType: "Lightweight Plastic", electronics: "JUNO-DS Engine" },
      { name: "Nord Stage 4 88-Key", price: 179000, bodyStyle: "Stage Piano / Synth", woodType: "Wooden / Metal Base", electronics: "Nord Triple Sensor Wave" },
    ],
  },
  {
    id: "roland-juno-ds61",
    brand: "ROLAND",
    title: "Roland JUNO-DS61 Synthesizer",
    price: 25500,
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Black", hex: "#18181b" },
    ],
    rating: 4.7,
    reviewsCount: 92,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Roland JUNO-DS61 คีย์บอร์ดซินธิไซเซอร์เวิร์กสเตชันยอดนิยมของนักดนตรีอาชีพและสตรีตโชว์ ด้วยน้ำหนักตัวที่เบา พกพาได้ด้วยการใส่ถ่าน ใช้งานง่ายในปุ่มหมุนด่วน ปรับเสียงสด ๆ ได้อย่างทันท่วงทีบนเวที ให้โทนเสียงเปียโน ออร์แกน และซินธ์ที่กว้างขวางครอบคลุมทุกแนว",
    specifications: [
      { label: "Keys", value: "61 velocity-sensitive synth-action keys" },
      { label: "Sound Engine", value: "JUNO-DS compatible with EXP expansion slots" },
      { label: "Pads", value: "8 Phrase pads for triggering samples & audio" },
      { label: "Mic Input", value: "Dedicated microphone input w/ Reverb and Vocoder" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "keyboard-bag", title: "Roland CB-B61 Premium Padded Bag", price: 1900, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
      { id: "sustain-pedal", title: "Yamaha FC4A Sustain Pedal", price: 1800, imageUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Roland JUNO-DS61", price: 25500, bodyStyle: "Synthesizer Workstation", woodType: "Lightweight Plastic", electronics: "JUNO-DS Engine" },
      { name: "Yamaha P-225 B", price: 26900, bodyStyle: "Digital Piano", woodType: "Sleek Compact Plastic", electronics: "CFX Tone Generator" },
      { name: "Korg Minilogue XD", price: 21900, bodyStyle: "Hybrid Synthesizer", woodType: "Wooden Backplate Panel", electronics: "Analog-Digital Multi-engine" },
    ],
  },
  {
    id: "korg-minilogue",
    brand: "KORG",
    title: "Korg Minilogue XD Hybrid Synthesizer",
    price: 21900,
    originalPrice: 24500,
    imageUrl: "https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Black", hex: "#18181b" },
    ],
    rating: 4.8,
    reviewsCount: 54,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Korg Minilogue XD ซินธิไซเซอร์กึ่งอนาล็อกโพลีโฟนิก 4 เสียง ผสานรวมขุมพลังเสียงอะนาล็อกคลาสสิกเข้ากับระบบมัลติเอนจิ้นดิจิทัลแบบแต่งเสียงเองได้ พร้อมเอฟเฟกต์สเตอริโอ 3 ตัวและซีเควนเซอร์ประสิทธิภาพสูงเพื่อการเล่นสดที่สร้างสรรค์อย่างเป็นอิสระ",
    specifications: [
      { label: "Keys", value: "37 velocity-sensitive slim keys" },
      { label: "Sound Engine", value: "4-voice Polyphonic Analog + Multi-digital oscillator" },
      { label: "Effects", value: "Modulation, Reverb, Delay (3 simultaneous blocks)" },
      { label: "Outputs", value: "Stereo L/R out, Headphone out, CV In/Out" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1618961313364-77a83d7350cb?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "keyboard-stand", title: "Double-Braced X-Style Stand", price: 990, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Korg Minilogue XD", price: 21900, bodyStyle: "Hybrid Synthesizer", woodType: "Wooden Backplate Panel", electronics: "Analog-Digital Multi-engine" },
      { name: "Roland JUNO-DS61", price: 25500, bodyStyle: "Synthesizer Workstation", woodType: "Lightweight Plastic", electronics: "JUNO-DS Engine" },
    ],
  },
  {
    id: "nord-stage4",
    brand: "NORD",
    title: "Nord Stage 4 88-Key Stage Keyboard",
    price: 179000,
    imageUrl: "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Nord Red", hex: "#b91c1c" },
    ],
    rating: 4.9,
    reviewsCount: 38,
    stockStatus: "Low Stock",
    descriptionLong: "คีย์บอร์ดเวทีระดับไฮเอนด์ Nord Stage 4 นำพาการออกแบบซาวด์เอ็นจิ้นใหม่ทั้งหมด รวมถึงสเปกคีย์ถ่วงน้ำหนักระดับพรีเมียมแบบ Triple Sensor มอบความลื่นไหลประหนึ่งเครื่องดนตรีชิ้นแพงบนคอนเสิร์ตฮอลล์ แบ่งสัดส่วนคุม 3 โซนหลักเปียโน ออร์แกน และซินธ์ได้อย่างง่ายดาย",
    specifications: [
      { label: "Keys", value: "88-key Triple Sensor hammer action weighted keyboard" },
      { label: "Sound Engine", value: "Nord Wave 2 Synth Engine & Drawbars Organ Engine" },
      { label: "Memory", value: "2GB for Nord Piano Library, 1GB for Sample Library" },
      { label: "Weight", value: "19.6 kg (43.2 lbs)" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "sustain-pedal", title: "Yamaha FC4A Sustain Pedal", price: 1800, imageUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=150&q=80" },
      { id: "keyboard-stand", title: "Double-Braced X-Style Stand", price: 990, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Nord Stage 4 88-Key", price: 179000, bodyStyle: "Stage Piano / Synth", woodType: "Wooden / Metal Base", electronics: "Nord Triple Sensor Wave" },
      { name: "Yamaha P-225 B", price: 26900, bodyStyle: "Digital Piano", woodType: "Sleek Compact Plastic", electronics: "CFX Tone Generator" },
    ],
  },
];

export const drumProducts: Product[] = [
  {
    id: "pearl-export",
    brand: "PEARL",
    title: "Pearl Export EXX725 Drum Set",
    price: 29500,
    originalPrice: 34000,
    imageUrl: "/catagory/drum.jpg",
    colors: [
      { name: "Jet Black", hex: "#18181b" },
      { name: "Smokey Chrome", hex: "#71717a" },
    ],
    rating: 4.7,
    reviewsCount: 46,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Pearl Export คือชุดกลองอะคูสติกที่ขายดีที่สุดในประวัติศาสตร์ ได้รับความไว้วางใจจากผู้เริ่มเล่นและมือกลองทุกระดับ โครงสร้างถังไม้ผสมผสาน Poplar / Asian Mahogany ด้วยเทคโนโลยี SST (Superior Shell Technology) ให้เสียงดุดันและพุ่งกระแทก",
    specifications: [
      { label: "Shell Composition", value: "6-ply 7.5mm Poplar / Asian Mahogany" },
      { label: "Config", value: "22\" Bass, 10\" & 12\" Toms, 16\" Floor Tom, 14\" Snare" },
      { label: "Hardware Included", value: "Pearl 830 Series Stand & Demonator Pedal" },
      { label: "Cymbals", value: "Sabian SBR Cymbal Set (Hi-hat, Crash, Ride)" },
    ],
    imagesGallery: ["/catagory/drum.jpg"],
    accessories: [
      { id: "drum-sticks", title: "Vic Firth 5A Drumsticks", price: 490, imageUrl: "https://images.unsplash.com/photo-1519890266781-13a884a88937?auto=format&fit=crop&w=150&q=80" },
      { id: "drum-throne", title: "MusicGear Professional Drum Throne", price: 1500, imageUrl: "https://images.unsplash.com/photo-1524230507669-e29d7cb76fe9?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Pearl Export EXX725", price: 29500, bodyStyle: "Acoustic 5-Piece Drum Set", woodType: "Poplar / Mahogany Shells", electronics: "None" },
      { name: "Roland TD-17KVX", price: 59000, bodyStyle: "Electronic Drum Kit", woodType: "Mesh Pad & Iron Rack", electronics: "TD-17 Drum Sound Module" },
    ],
  },
  {
    id: "roland-td17kvx",
    brand: "ROLAND",
    title: "Roland TD-17KVX V-Drums Electronic Kit",
    price: 59000,
    imageUrl: "https://images.unsplash.com/photo-1605020422156-205573a53368?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Black", hex: "#18181b" },
    ],
    rating: 4.9,
    reviewsCount: 71,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Roland TD-17KVX คือผู้นำด้านกลองไฟฟ้าระดับกลางถึงสูง มอบสัมผัสการซ้อมเสมือนกลองอะคูสติกด้วยแป้นตาข่าย (Mesh Pads) ขนาดใหญ่ และโมดูลเสียงรุ่น TD-17 ที่มีลูกเล่นการซ้อมและปรับเสียงที่ครบครัน สามารถเชื่อมต่อ Bluetooth สำหรับเปิดแบ็คกิ้งแทร็ก",
    specifications: [
      { label: "Pads Material", value: "Double-ply Mesh Heads with tension adjustment" },
      { label: "Sound Module", value: "TD-17 Module with custom sample loading" },
      { label: "Cymbals", value: "12\" Hi-hat (VH-10), 12\" Crash (CY-12C), 13\" Ride (CY-13R)" },
      { label: "Bluetooth", value: "Compatible for audio streaming & MIDI" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1605020422156-205573a53368?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "drum-sticks", title: "Vic Firth 5A Drumsticks", price: 490, imageUrl: "https://images.unsplash.com/photo-1519890266781-13a884a88937?auto=format&fit=crop&w=150&q=80" },
      { id: "drum-throne", title: "MusicGear Professional Drum Throne", price: 1500, imageUrl: "https://images.unsplash.com/photo-1524230507669-e29d7cb76fe9?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Roland TD-17KVX", price: 59000, bodyStyle: "Electronic Drum Kit", woodType: "Mesh Pad & Iron Rack", electronics: "TD-17 Drum Sound Module" },
      { name: "Pearl Export EXX725", price: 29500, bodyStyle: "Acoustic 5-Piece Drum Set", woodType: "Poplar / Mahogany Shells", electronics: "None" },
    ],
  },
  {
    id: "tama-clubjam",
    brand: "TAMA",
    title: "Tama Club-JAM Kit Compact Shell Pack",
    price: 16900,
    originalPrice: 19500,
    imageUrl: "https://images.unsplash.com/photo-1524230507669-e29d7cb76fe9?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Cream", hex: "#fef08a" },
      { name: "Charcoal", hex: "#27272a" },
    ],
    rating: 4.6,
    reviewsCount: 32,
    stockStatus: "Low Stock",
    descriptionLong: "Tama Club-JAM นำดีไซน์กลองชุดสไตล์เรโทรแบบคอมแพกต์พกพาง่ายมานำเสนอ เหมาะเป็นอย่างยิ่งสำหรับคาเฟ่ คลับบาร์ขนาดเล็ก และการแสดงบนท้องถนน ตัวถังทำจากไม้ Mersawa / Poplar ที่ให้เสียงสว่างสดใส คมชัดสะใจ",
    specifications: [
      { label: "Shell Material", value: "Mersawa / Poplar Hybrid Shells (6-ply)" },
      { label: "Dimensions", value: "18\" Bass, 10\" Tom, 14\" Floor Tom, 13\" Snare" },
      { label: "Hardware", value: "Includes Cymbal holder mounted directly on the bass drum" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1524230507669-e29d7cb76fe9?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "drum-sticks", title: "Vic Firth 5A Drumsticks", price: 490, imageUrl: "https://images.unsplash.com/photo-1519890266781-13a884a88937?auto=format&fit=crop&w=150&q=80" },
      { id: "drum-throne", title: "MusicGear Professional Drum Throne", price: 1500, imageUrl: "https://images.unsplash.com/photo-1524230507669-e29d7cb76fe9?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Tama Club-JAM Kit", price: 16900, bodyStyle: "Compact Acoustic Drum Set", woodType: "Mersawa / Poplar Hybrid", electronics: "None" },
      { name: "Pearl Export EXX725", price: 29500, bodyStyle: "Acoustic 5-Piece Drum Set", woodType: "Poplar / Mahogany Shells", electronics: "None" },
    ],
  },
  {
    id: "alesis-nitro",
    brand: "ALESIS",
    title: "Alesis Nitro Max Electronic Drum Kit",
    price: 15900,
    imageUrl: "https://images.unsplash.com/photo-1519890266781-13a884a88937?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Black", hex: "#18181b" },
    ],
    rating: 4.5,
    reviewsCount: 59,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "Alesis Nitro Max มอบความคุ้มค่าสูงสุดสำหรับผู้ที่ต้องการซ้อมดนตรีในที่พักอาศัย มาพร้อมแป้นตาข่ายเกรดดีสี่ชิ้น (Snare 10\" Dual-zone และ 3x Toms 8\") และโมดูล Nitro Max ที่บรรจุชุดเสียงคุณภาพระดับมืออาชีพกว่า 400 เสียง",
    specifications: [
      { label: "Pads", value: "10\" Mesh Snare, 3x 8\" Mesh Toms, Kick Tower" },
      { label: "Sounds", value: "Over 440 Drum, Cymbal, and Percussion sounds" },
      { label: "Play-along Tracks", value: "60 Built-in tracks with sequencer and recorder" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1519890266781-13a884a88937?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "drum-sticks", title: "Vic Firth 5A Drumsticks", price: 490, imageUrl: "https://images.unsplash.com/photo-1519890266781-13a884a88937?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Alesis Nitro Max", price: 15900, bodyStyle: "Electronic Drum Kit", woodType: "Mesh Pad w/ Lightweight Rack", electronics: "Nitro Max Sound Module" },
      { name: "Roland TD-17KVX", price: 59000, bodyStyle: "Electronic Drum Kit", woodType: "Mesh Pad & Iron Rack", electronics: "TD-17 Drum Sound Module" },
    ],
  },
];

export const proAudioProducts: Product[] = [
  {
    id: "focusrite-2i2",
    brand: "FOCUSRITE",
    title: "Focusrite Scarlett 2i2 4th Gen Interface",
    price: 8900,
    originalPrice: 9900,
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Red", hex: "#b91c1c" },
    ],
    rating: 4.8,
    reviewsCount: 145,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "นี่คืออินเตอร์เฟสรุ่นใหม่ล่าสุดที่เป็นหัวใจในทุกโฮมสตูดิโอ Scarlett 2i2 4th Gen นำเสนอไมค์พรีแอมป์ที่มีค่าความเพี้ยนต่ำเป็นพิเศษและช่วงไดนามิกเกนที่กว้างถึง 120dB พร้อมฟีเจอร์ Auto Gain, Clip Safe และโหมด Air ปรับโทนเสียงอะคูสติกหรูหรา",
    specifications: [
      { label: "Inputs", value: "2x XLR/TRS Combo with high headroom preamps" },
      { label: "Outputs", value: "2x 1/4\" Balanced outputs, 1x Headphone output" },
      { label: "Resolution", value: "24-bit / 192kHz audio converters" },
      { label: "Features", value: "Auto Gain, Clip Safe, Air Mode, Loopback" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "xlr-cable", title: "Mogami Gold Studio XLR Cable (10ft)", price: 2200, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
      { id: "pop-filter", title: "MusicGear Professional Pop Filter", price: 490, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Focusrite Scarlett 2i2 4G", price: 8900, bodyStyle: "Audio Interface", woodType: "Anodized Aluminum Shell", electronics: "24-bit/192kHz converters" },
      { name: "Shure SM7B", price: 16900, bodyStyle: "Vocal Microphone", woodType: "Steel / Aluminum Housing", electronics: "Dynamic Cardioid Element" },
    ],
  },
  {
    id: "shure-sm7b",
    brand: "SHURE",
    title: "Shure SM7B Vocal Microphone",
    price: 16900,
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Dark Gray", hex: "#3f3f46" },
    ],
    rating: 4.9,
    reviewsCount: 198,
    stockStatus: "In Stock - Ships today",
    descriptionLong: "ไมโครโฟนไดนามิกระดับตำนานที่เป็นมาตรฐานทองคำสำหรับวงการวิทยุ พ็อดคาสต์ และบันทึกเสียงร้องของศิลปิน ให้เสียงที่อุ่น หนา นุ่มนวล ป้องกันเสียงรบกวนรอบข้างและการรบกวนทางไฟฟ้าจากคลื่นคอมพิวเตอร์อย่างมีประสิทธิภาพสูงสุด",
    specifications: [
      { label: "Type", value: "Dynamic microphone" },
      { label: "Polar Pattern", value: "Cardioid" },
      { label: "Frequency Range", value: "50 to 20,000 Hz" },
      { label: "Output Impedance", value: "150 ohms" },
    ],
    imagesGallery: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80"],
    accessories: [
      { id: "xlr-cable", title: "Mogami Gold Studio XLR Cable (10ft)", price: 2200, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
      { id: "pop-filter", title: "MusicGear Professional Pop Filter", price: 490, imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=150&q=80" },
    ],
    comparisons: [
      { name: "Shure SM7B", price: 16900, bodyStyle: "Vocal Microphone", woodType: "Steel / Aluminum Housing", electronics: "Dynamic Cardioid Element" },
      { name: "Focusrite Scarlett 2i2 4G", price: 8900, bodyStyle: "Audio Interface", woodType: "Anodized Aluminum Shell", electronics: "24-bit/192kHz converters" },
    ],
  },
];

export const allProducts: Product[] = [
  ...guitarProducts,
  ...keyboardProducts,
  ...drumProducts,
  ...proAudioProducts,
];

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}
