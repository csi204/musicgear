"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus, X, Loader2, AlertCircle, Check, HelpCircle, Zap } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { getProducts, getInventory, getCategories, getBrands, getOrders, ProductRecord, adjustStock, getProductById, updateProduct, deleteProductById, createBrand } from "@/lib/api";
import { getAccessToken, getApiBaseUrl } from "@/lib/auth";
import { CustomSelect } from "@/components/custom-select";
import { Pagination } from "@/components/pagination";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/toast-provider";


type ProductStatus = "active" | "inactive" | "out_of_stock" | "discontinued";

interface DisplayProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  reserved: number;
  maxCapacity: number;
  status: ProductStatus;
  description: string;
  skillLevel: string;
  images: any[];
}

const statusConfig: Record<ProductStatus, { label: string; badge: string; dot: string }> = {
  active: { label: "มีสินค้า", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  inactive: { label: "ปิดใช้งาน", badge: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800/40 dark:text-zinc-400", dot: "bg-zinc-400" },
  out_of_stock: { label: "สินค้าหมด", badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  discontinued: { label: "ยกเลิกผลิต", badge: "bg-zinc-100 text-zinc-650 dark:bg-zinc-800/40 dark:text-zinc-400", dot: "bg-zinc-400" },
};

// ─────────────────────────────────────────────────────
const formatNumberWithCommas = (val: string | number) => {
  if (val === null || val === undefined || val === "") return "";
  const numStr = String(val).replace(/,/g, "");
  const cleanNum = numStr.replace(/[^\d.]/g, "");
  if (!cleanNum) return "";
  const parts = cleanNum.split(".");
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return parts.slice(0, 2).join(".");
};

// Skeletons
// ─────────────────────────────────────────────────────
function ProductRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="pl-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12" /></TableCell>
      <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-6" />
        </div>
      </TableCell>
      <TableCell><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
      <TableCell className="pr-6 text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-16 inline-block" /></TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────
// StockBar — reserved section is now grey
// ─────────────────────────────────────────────────────
function StockBar({ stock, reserved }: { stock: number; reserved: number }) {
  const max = Math.max(stock, 50);
  const availPct = Math.min((stock - reserved) / max, 1) * 100;
  const reservedPct = Math.min(reserved / max, 1) * 100;
  const isLow = stock - reserved <= 5 && stock > 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
        <div
          className={`h-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${availPct}%` }}
        />
        <div
          className="h-full bg-zinc-400/40 dark:bg-zinc-550/40"
          style={{ width: `${reservedPct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums ${isLow ? "text-amber-650 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200"}`}>
        {stock - reserved}
      </span>
    </div>
  );
}

// Preset image quick-adds for the product image picker
const MOCK_IMAGES = [
  { label: "Guitar", url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&auto=format&fit=crop&q=60" },
  { label: "Piano", url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=300&auto=format&fit=crop&q=60" },
  { label: "Drums", url: "https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?w=300&auto=format&fit=crop&q=60" },
  { label: "Violin", url: "https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?w=300&auto=format&fit=crop&q=60" },
  { label: "Mic", url: "https://plus.unsplash.com/premium_photo-1677155842676-8e13e7053844?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { label: "Amp", url: "https://images.unsplash.com/photo-1546518449-3826f84350e9?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { label: "Cable", url: "https://images.unsplash.com/photo-1636800873836-c5911c7e3d36?q=80&w=748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { label: "Pedal", url: "https://images.unsplash.com/photo-1613065053787-93fef9374112?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
    categoryId: "",
    brandId: "",
    imageUrl: "",
    isBeginner: false,
    stock: "",
  });
  const [categories, setCategories] = useState<{ categoryId: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ brandId: string; name: string }[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRecord[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [specDefinitions, setSpecDefinitions] = useState<{ definitionId: string; name: string; group: string }[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});

  // Images state
  const [imageItems, setImageItems] = useState<{ id: string; url: string; file?: File; isPrimary: boolean }[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string>("");

  // Recommendations & Search
  const [linkedProducts, setLinkedProducts] = useState<ProductRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductRecord[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<ProductRecord[]>([]);

  const handleBrandChange = async (val: string) => {
    if (val === "add_new") {
      const newName = window.prompt("ระบุชื่อแบรนด์ใหม่ที่ต้องการเพิ่ม:");
      if (newName && newName.trim()) {
        try {
          const res = await createBrand(newName.trim());
          const newBrand = res.brand;
          setBrands(prev => [...prev, newBrand]);
          setForm(prev => ({ ...prev, brandId: newBrand.brandId }));
        } catch (err: any) {
          toast({ type: "error", title: "ไม่สามารถสร้างแบรนด์ได้", description: err.message ?? "เกิดข้อผิดพลาดในการสร้างแบรนด์" });
        }
      }
    } else {
      setForm(prev => ({ ...prev, brandId: val }));
    }
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const catRes = await getCategories();
        const brandRes = await getBrands();
        setCategories(catRes.categories ?? []);
        setBrands(brandRes.brands ?? []);

        // Load all products and orders to compute suggestions
        const prodRes = await getProducts({ limit: 100 });
        setAllProducts(prodRes.products ?? []);

        const orderRes = await getOrders({ limit: 100 }).catch(() => ({ orders: [] }));
        setRecentOrders(orderRes.orders ?? []);
      } catch (e) {
        console.error("Failed to load categories/brands/products", e);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    if (!form.categoryId) {
      setSpecDefinitions([]);
      return;
    }

    async function loadSpecs() {
      try {
        const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
        const res = await fetch(`${apiBase}/products/categories/${form.categoryId}/specifications`, {
          headers: {
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSpecDefinitions(data.specifications ?? []);
          setSpecValues({});
        }
      } catch (err) {
        console.error("Failed to load specs for category", err);
      }
    }

    loadSpecs();
  }, [form.categoryId]);

  // Score & suggest related items
  const computeSuggestions = useCallback((
    productName: string, 
    catId: string, 
    bId: string, 
    productsList: ProductRecord[], 
    ordersList: any[]
  ) => {
    if (!productsList || productsList.length === 0) return;

    // 1. Calculate co-purchase frequencies
    const coPurchaseCounts: Record<string, number> = {};
    for (const order of ordersList) {
      if (Array.isArray(order.items) && order.items.length > 1) {
        const itemIds = order.items.map((it: any) => it.productId);
        for (const id of itemIds) {
          coPurchaseCounts[id] = (coPurchaseCounts[id] || 0) + 1;
        }
      }
    }

    // 2. Score candidates
    const scored = productsList.map(candidate => {
      let score = 0;
      if (candidate.name.toLowerCase() === productName.toLowerCase()) {
        return { candidate, score: -100 };
      }
      if (linkedProducts.some(lp => lp.productId === candidate.productId)) {
        return { candidate, score: -100 };
      }

      // Category matching
      if (catId && candidate.category?.categoryId === catId) {
        score += 5;
      }
      // Brand matching
      if (bId && candidate.brand?.brandId === bId) {
        score += 2;
      }

      // Keyword matching
      const nameLower = productName.toLowerCase();
      const candLower = candidate.name.toLowerCase();
      if (nameLower.includes("guitar") || nameLower.includes("กีตาร์")) {
        if (candLower.includes("cable") || candLower.includes("สาย")) score += 10;
        if (candLower.includes("stand") || candLower.includes("ขาตั้ง")) score += 10;
        if (candLower.includes("strap") || candLower.includes("สายสะพาย")) score += 10;
        if (candLower.includes("string") || candLower.includes("สายกีตาร์")) score += 10;
        if (candLower.includes("case") || candLower.includes("กระเป๋า")) score += 10;
      }
      if (nameLower.includes("mic") || nameLower.includes("ไมค์") || nameLower.includes("microphone")) {
        if (candLower.includes("stand") || candLower.includes("ขาตั้ง")) score += 10;
        if (candLower.includes("cable") || candLower.includes("สาย")) score += 10;
        if (candLower.includes("filter") || candLower.includes("กันลม")) score += 10;
      }
      if (nameLower.includes("monitor") || nameLower.includes("speaker") || nameLower.includes("ลำโพง")) {
        if (candLower.includes("cable") || candLower.includes("สาย")) score += 8;
        if (candLower.includes("stand") || candLower.includes("ขาตั้ง")) score += 8;
        if (candLower.includes("pad") || candLower.includes("แผ่นรอง")) score += 8;
      }

      // Co-purchase sales data
      const coPurchaseCount = coPurchaseCounts[candidate.productId];
      if (coPurchaseCount !== undefined) {
        score += coPurchaseCount * 4;
      }

      // Generic accessory matching
      const catName = candidate.category?.name?.toLowerCase() || "";
      if (catName.includes("cable") || catName.includes("accessories") || catName.includes("stand") || catName.includes("สาย") || catName.includes("ขาตั้ง")) {
        score += 5;
      }

      return { candidate, score };
    });

    const topSuggestions = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.candidate)
      .slice(0, 4);

    setSmartSuggestions(topSuggestions);
  }, [linkedProducts]);

  useEffect(() => {
    if (form.name || form.categoryId || form.brandId) {
      computeSuggestions(form.name, form.categoryId, form.brandId, allProducts, recentOrders);
    }
  }, [form.name, form.categoryId, form.brandId, allProducts, recentOrders, computeSuggestions]);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const filtered = allProducts.filter(p => 
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
        !linkedProducts.some(lp => lp.productId === p.productId)
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allProducts, linkedProducts]);

  const handleLinkProduct = (prod: ProductRecord) => {
    setLinkedProducts(prev => {
      if (prev.some(p => p.productId === prod.productId)) return prev;
      return [...prev, prod];
    });
    setSearchQuery("");
  };

  const handleUnlinkProduct = (prodId: string) => {
    setLinkedProducts(prev => prev.filter(p => p.productId !== prodId));
  };

  // Image Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems = files.map((file, idx) => {
        const url = URL.createObjectURL(file);
        return {
          id: `local-${Math.random()}-${idx}`,
          url,
          file,
          isPrimary: imageItems.length === 0 && idx === 0,
        };
      });
      setImageItems(prev => {
        const updated = [...prev, ...newItems];
        if (newItems[0]) setActiveImageUrl(newItems[0].url);
        return updated;
      });
    }
  };

  const handleAddUrl = () => {
    if (!form.imageUrl.trim()) return;
    const newItem = {
      id: `url-${Math.random()}`,
      url: form.imageUrl.trim(),
      isPrimary: imageItems.length === 0,
    };
    setImageItems(prev => {
      const updated = [...prev, newItem];
      setActiveImageUrl(newItem.url);
      return updated;
    });
    setForm(prev => ({ ...prev, imageUrl: "" }));
  };

  const handleAddPreset = (url: string) => {
    const newItem = {
      id: `preset-${Math.random()}`,
      url,
      isPrimary: imageItems.length === 0,
    };
    setImageItems(prev => {
      const updated = [...prev, newItem];
      setActiveImageUrl(newItem.url);
      return updated;
    });
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      const wasActive = prev.find(item => item.id === id)?.url === activeImageUrl;
      if (wasActive) {
        setActiveImageUrl(filtered[0]?.url || "");
      }
      return filtered;
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.price) {
      setError("กรุณากรอกข้อมูลที่จำเป็น: ชื่อสินค้า, SKU และราคา");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
      const token = getAccessToken();

      // Check if we need multipart upload
      const hasLocalFiles = imageItems.some(item => item.file);

      const formattedSpecifications = Object.entries(specValues)
        .filter(([_, val]) => val.trim() !== "")
        .map(([defId, val]) => ({ definitionId: defId, value: val }));

      let res: Response;
      if (hasLocalFiles) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("sku", form.sku);
        fd.append("price", form.price);
        fd.append("description", form.description);
        fd.append("categoryId", form.categoryId);
        fd.append("brandId", form.brandId);
        fd.append("skillLevel", form.isBeginner ? "beginner" : "");
        fd.append("status", "active");
        fd.append("recommendations", JSON.stringify(linkedProducts.map(p => p.productId)));
        fd.append("specifications", JSON.stringify(formattedSpecifications));

        // Append File objects
        imageItems.forEach(item => {
          if (item.file) {
            fd.append("images", item.file);
          }
        });

        // Append non-file URLs
        const urlImages = imageItems.filter(item => !item.file).map((item, idx) => ({
          imageUrl: item.url,
          isPrimary: item.isPrimary,
          sortOrder: idx
        }));
        if (urlImages.length > 0) {
          fd.append("images", JSON.stringify(urlImages));
        }

        res = await fetch(`${apiBase}/products`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        });
      } else {
        const urlImages = imageItems.map((item, idx) => ({
          imageUrl: item.url,
          isPrimary: item.isPrimary,
          sortOrder: idx
        }));

        res = await fetch(`${apiBase}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: form.name,
            sku: form.sku,
            price: Number(form.price),
            description: form.description || undefined,
            categoryId: form.categoryId || undefined,
            brandId: form.brandId || undefined,
            skillLevel: form.isBeginner ? "beginner" : null,
            status: "active",
            images: urlImages,
            recommendations: linkedProducts.map(p => p.productId),
            specifications: formattedSpecifications
          }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `ผิดพลาด ${res.status}: ${res.statusText}`);
      }

      const createdProduct = await res.json();
      const newProductId = createdProduct.product?.productId || createdProduct.productId;

      // Adjust initial stock
      const initialStockQty = parseInt(form.stock, 10);
      if (newProductId && !isNaN(initialStockQty) && initialStockQty > 0) {
        await adjustStock({
          productId: newProductId,
          changeQty: initialStockQty,
          action: "receive",
        });
      }
      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message ?? "เกิดข้อผิดพลาดที่ไม่รู้จัก กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-[#2a2a2d] rounded-2xl max-w-4xl w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden max-h-[92vh] h-[90vh] text-zinc-900 dark:text-[#e5e1e6] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-[#2a2a2d]">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">เพิ่มสินค้าใหม่</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">กรอกข้อมูลสินค้าเพื่อเพิ่มลงในคลังสินค้าระบบหลังบ้าน</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors p-1 bg-zinc-100 dark:bg-zinc-800/40 rounded-lg border border-zinc-250/50 dark:border-zinc-700/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              เพิ่มสินค้าและสถิติดำเนินการเสร็จสมบูรณ์แล้ว! กำลังอัปเดตข้อมูล...
            </div>
          )}

          {/* Top Section: Core Details & Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">ชื่อสินค้า *</label>
                  <input
                    type="text"
                    placeholder="เช่น Fender Player Stratocaster"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">รหัสสินค้า (SKU) *</label>
                  <input
                    type="text"
                    placeholder="เช่น FEN-PLAY-STRAT"
                    value={form.sku}
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Custom Category Dropdown */}
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">หมวดหมู่ *</label>
                  <CustomSelect
                    value={form.categoryId}
                    onChange={(val) => setForm(prev => ({ ...prev, categoryId: val }))}
                    options={categories.map(c => ({ value: c.categoryId, label: c.name }))}
                    placeholder="เลือกหมวดหมู่..."
                    triggerClassName="bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 py-3 h-11"
                    dropdownClassName="bg-white dark:bg-[#2a2a2d] border-zinc-200 dark:border-[#2a2a2d] text-zinc-900 dark:text-white divide-y divide-zinc-100 dark:divide-zinc-800"
                  />
                </div>

                {/* Custom Brand Dropdown */}
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">แบรนด์ *</label>
                  <CustomSelect
                    value={form.brandId}
                    onChange={handleBrandChange}
                    options={[
                      ...brands.map(b => ({ value: b.brandId, label: b.name })),
                      { value: "add_new", label: "+ เพิ่มแบรนด์ใหม่..." }
                    ]}
                    placeholder="เลือกแบรนด์..."
                    triggerClassName="bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 py-3 h-11"
                    dropdownClassName="bg-white dark:bg-[#2a2a2d] border-zinc-200 dark:border-[#2a2a2d] text-zinc-900 dark:text-white divide-y divide-zinc-100 dark:divide-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">ราคา (บาท) *</label>
                  <input
                    type="text"
                    placeholder="เช่น 32,000"
                    value={formatNumberWithCommas(form.price)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const raw = val.replace(/,/g, "");
                      if (raw === "" || Number(raw) >= 0) {
                        setForm(prev => ({ ...prev, price: raw }));
                      }
                    }}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">จำนวนสินค้าคงคลัง</label>
                  <input
                    type="number"
                    placeholder="เริ่มต้นเป็น 1"
                    value={form.stock}
                    min="1"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) > 0) {
                        setForm(prev => ({ ...prev, stock: val }));
                      }
                    }}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">คำอธิบายสินค้า</label>
                <textarea
                  placeholder="คำอธิบายสินค้า..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all resize-none"
                />
              </div>

              {/* Checkbox for Beginner */}
              <div className="flex items-start gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer select-none" onClick={() => setForm(prev => ({ ...prev, isBeginner: !prev.isBeginner }))}>
                <div className={`mt-2 w-8 h-5 rounded border flex items-center justify-center transition-all ${form.isBeginner ? "bg-amber-500 border-amber-500 text-white" : "border-zinc-300 dark:border-zinc-650 bg-white dark:bg-zinc-900"}`}>
                  {form.isBeginner && <Check className="w-3 h-3 stroke-[3px]" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">แนะนำสำหรับมือใหม่</span>
                  <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">ติ๊กเลือกหากสินค้าชิ้นนี้เหมาะสำหรับมือใหม่ เพื่อเพิ่มป้ายแนะนำและช่วยการค้นหาในหน้าแสดงสินค้าของลูกค้า</p>
                </div>
              </div>
            </div>

            {/* Right: Media Upload (Glassmorphism inspired) */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-550 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block">รูปภาพสินค้า</label>
              
              {/* File Upload / Main Image Display */}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="product-image-file-input"
                onChange={handleFileChange}
              />
              <div 
                onClick={() => document.getElementById("product-image-file-input")?.click()}
                className="bg-zinc-50 dark:bg-[rgba(42,42,45,0.5)] border-2 border-zinc-250 dark:border-zinc-700 border-dashed rounded-xl h-[220px] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden cursor-pointer hover:border-amber-500 transition-colors group"
              >
                {activeImageUrl ? (
                  <>
                    <img src={activeImageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-700">อัปเดตไฟล์ภาพอื่น</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors">
                      <Plus className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง</p>
                      <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">หรือระบุลิงก์ / คลิก Preset ด้านล่างเพื่อเพิ่ม</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Paste URL Area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="วาง Link รูปภาพสินค้าตรงนี้ (URL)..."
                  value={form.imageUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="flex-1 px-4 py-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-450 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="px-4 py-2 text-xs font-bold bg-[#ff8a3d] text-white rounded-lg hover:bg-[#ff8a3d]/90 transition-colors shrink-0"
                >
                  เพิ่มรูป
                </button>
              </div>

              {/* Added Images Gallery (Thumbnails) */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase block">รูปภาพสินค้า ({imageItems.length})</span>
                {imageItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {imageItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveImageUrl(item.url)}
                        className={`group relative w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${activeImageUrl === item.url ? "border-amber-500 scale-95 shadow-lg shadow-amber-500/10" : "border-zinc-200 dark:border-zinc-750 hover:border-zinc-400 dark:hover:border-zinc-500"}`}
                      >
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(item.id, e)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 italic">ยังไม่ได้เลือกรูปภาพ (ระบบจะใช้รูปภาพกองกลางหากว่างไว้)</p>
                )}
              </div>

              {/* Quick Preset Images templates */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-550 dark:text-zinc-500 tracking-wider uppercase block mb-2">รูปภาพสำเร็จรูป (Presets)</span>
                <div className="grid grid-cols-4 gap-2">
                  {MOCK_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => handleAddPreset(img.url)}
                      className="group relative h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden text-left hover:border-amber-500/50 transition-all cursor-pointer"
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                        <span className="text-[9px] font-bold text-white tracking-tight">{img.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Specifications Section */}
          {specDefinitions.length > 0 && (
            <div className="px-8 py-6 border-t border-zinc-150 dark:border-[#2a2a2d]">
              <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white">
                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                <h4 className="text-lg font-bold">ข้อมูลจำเพาะสินค้า (Product Specifications)</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                กรอกข้อมูลทางเทคนิคของหมวดหมู่นี้เพื่อนำไปเปรียบเทียบสเปกและใช้ตัวกรองค้นหาทางหน้าเว็บลูกค้า
              </p>
              
              {/* Group specs by group name */}
              {Object.entries(
                specDefinitions.reduce((acc, curr) => {
                  const g = curr.group;
                  if (!acc[g]) acc[g] = [];
                  acc[g]!.push(curr);
                  return acc;
                }, {} as Record<string, typeof specDefinitions>)
              ).map(([groupName, defs]) => (
                <div key={groupName} className="mb-6 space-y-3">
                  <h5 className="text-xs font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">{groupName}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defs.map((def) => (
                      <div key={def.definitionId}>
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">{def.name}</label>
                        <input
                          type="text"
                          placeholder={`ระบุ ${def.name}...`}
                          value={specValues[def.definitionId] || ""}
                          onChange={(e) => setSpecValues(prev => ({ ...prev, [def.definitionId]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-px bg-zinc-150 dark:bg-[#2a2a2d] my-6" />

          {/* Bottom Section: Cross-selling (Frequently Bought Together) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h4 className="text-lg font-bold">สินค้าแนะนำที่ควรซื้อร่วมกัน</h4>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              สินค้าแนะนำที่มักจะซื้อร่วมกันบ่อยๆ เพื่อแสดงให้ลูกค้าเพิ่มสินค้าพร้อมกันได้ ระบบจะช่วยวิเคราะห์ข้อมูลยอดสั่งซื้อ และหมวดหมู่เข้ากันเพื่อแนะนำเบื้องต้น และคุณสามารถเลือกปรับเพิ่ม/ลดได้เอง
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left search & link area */}
              <div className="md:col-span-1 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาอุปกรณ์เพื่อเชื่อมโยง..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-450 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-zinc-450 dark:text-zinc-505" />
                  
                  {/* Search results overlay */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#2a2a2d] border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                      {searchResults.map((prod) => (
                        <button
                          key={prod.productId}
                          onClick={() => handleLinkProduct(prod)}
                          className="w-full px-4 py-2.5 text-left text-xs hover:bg-[#ff8a3d]/20 hover:text-white text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold block truncate">{prod.name}</span>
                            <span className="text-[10px] text-zinc-500">{prod.sku} • {Number(prod.price).toLocaleString("th-TH")} บาท</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Smart Suggestions from Recommendation Engine */}
                <div className="bg-zinc-50 dark:bg-[#2a2a2d]/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-3.5">
                  <span className="text-[12px] font-extrabold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase block">
                    {smartSuggestions.length > 0 ? "แนะนำโดยระบบ (Smart Suggestions)" : "ป้อนชื่อหรือหมวดหมู่สินค้าด้านบน"}
                  </span>
                  {smartSuggestions.length > 0 ? (
                    <div className="space-y-2">
                      {smartSuggestions.map((prod) => (
                        <button
                          key={prod.productId}
                          type="button"
                          onClick={() => handleLinkProduct(prod)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-800/60 hover:bg-[#ff8a3d]/15 border border-zinc-200 dark:border-zinc-700/40 text-left text-[11px] transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500 block truncate">{prod.name}</span>
                            <span className="text-[9px] text-zinc-500">{prod.category?.name} · {Number(prod.price).toLocaleString("th-TH")} บาท</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-450 dark:text-zinc-500">ระบบจะทำการสแกนความสอดคล้องของสินค้าทันทีเมื่อพิมพ์ชื่อ หรือเลือกแบรนด์/หมวดหมู่หลัก</p>
                  )}
                </div>
              </div>

              {/* Linked items list (Bento Grid) */}
              <div className="md:col-span-2">
                <span className="text-[12px] font-extrabold text-zinc-450 dark:text-zinc-400 tracking-wider uppercase block mb-3">
                  สินค้าที่เชื่อมโยงกัน ({linkedProducts.length} รายการ)
                </span>
                
                {linkedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {linkedProducts.map((prod) => {
                      const primaryImage = prod.images?.find((img: any) => img.isPrimary)?.imageUrl || 
                                           (prod.images?.[0]?.imageUrl) || 
                                           "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&auto=format&fit=crop&q=60";
                      return (
                        <div
                          key={prod.productId}
                          className="bg-zinc-50 dark:bg-[#2a2a2d] border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3 flex items-center gap-3 relative group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700/35">
                            <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <h5 className="text-xs font-bold text-zinc-850 dark:text-white truncate">{prod.name}</h5>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-450 block truncate">{prod.sku}</span>
                            <span className="text-xs font-black text-amber-500 mt-0.5 block">{Number(prod.price).toLocaleString("th-TH")} บาท</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnlinkProduct(prod.productId)}
                            className="absolute top-2 right-2 text-zinc-450 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[180px] border border-zinc-250 dark:border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 bg-zinc-50 dark:bg-zinc-900/10">
                    <p className="text-sm text-zinc-500">ไม่มีการเชื่อมโยงสินค้าแนะนำใดๆ</p>
                    <p className="text-[12px] text-zinc-400 dark:text-zinc-650 mt-1">ค้นหาหรือเลือกสินค้าจากระบบแนะนำ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-zinc-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1f1f22] flex gap-3 justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-750 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white transition-all"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || success}
            className="px-8 py-2.5 rounded-lg bg-[#ff8a3d] hover:bg-[#ff8a3d]/90 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-[#ff8a3d]/15 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? "กำลังเพิ่ม" : "เพิ่มสินค้า"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function ProductsPage() {
  const { isAdmin } = useUser();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DisplayProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<DisplayProduct | null>(null);

  // Filters state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStatus]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prodRes = await getProducts({ limit: 100 });
      const invRes = await getInventory();

      const invMap = new Map(invRes.inventories?.map((i) => [i.productId, i]) ?? []);
      const mapped: DisplayProduct[] = prodRes.products.map((p) => {
        const inv = invMap.get(p.productId);
        const stock = inv?.quantity ?? 0;
        const reserved = inv?.reservedQuantity ?? 0;
        const maxCapacity = inv?.maxCapacity ?? 100;
        let status: ProductStatus = p.status as ProductStatus;
        if (p.status === "active" && (stock - reserved) <= 0) status = "out_of_stock";
        return {
          id: p.productId,
          name: p.name,
          sku: p.sku,
          category: p.category?.name ?? "ทั่วไป",
          brand: p.brand?.name ?? "ไม่ระบุแบรนด์",
          price: p.price,
          stock,
          reserved,
          maxCapacity,
          status,
          description: p.description ?? "ไม่มีคำอธิบายเพิ่มเติมสำหรับสินค้านี้",
          skillLevel: p.skillLevel ?? "ไม่ระบุระดับ",
          images: p.images ?? []
        };
      });
      setProducts(mapped);
    } catch (e: any) {
      setError(e.message ?? "ไม่สามารถโหลดข้อมูลสินค้าได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Extract unique categories for dropdown filter
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filtered = products.filter(
    (p) => {
      const matchSearch = search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchStatus = selectedStatus === "all" || p.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    }
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">รายการสินค้า</h2>
          <p className="text-zinc-500 text-sm mt-1">ดูสินค้าและสถานะสต็อก — การแก้ไขราคา/เพิ่มสินค้าต้องมีสิทธิ์ Admin</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสินค้า
          </button>
        )}
      </div>

      {/* Main table card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า, SKU, แบรนด์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm font-semibold ${
                showFilterPanel
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              กรองข้อมูล
            </button>
            <span className="text-sm font-semibold text-zinc-750 dark:text-zinc-300 ml-auto">{filtered.length} รายการ</span>
          </div>

          {/* Expanded Filter Panel */}
          {showFilterPanel && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 block mb-1.5">หมวดหมู่</label>
                <CustomSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={[
                    { value: "all", label: "หมวดหมู่ทั้งหมด" },
                    ...categories.map((cat) => ({ value: cat, label: cat }))
                  ]}
                  triggerClassName="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-250 dark:border-zinc-700 text-sm py-2 px-3 h-10"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300 block mb-1.5">สถานะ</label>
                <CustomSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: "all", label: "สถานะทั้งหมด" },
                    { value: "active", label: "มีสินค้า" },
                    { value: "out_of_stock", label: "สินค้าหมด" },
                    { value: "inactive", label: "ปิดใช้งาน" },
                    { value: "discontinued", label: "ยกเลิกผลิต" }
                  ]}
                  triggerClassName="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-250 dark:border-zinc-700 text-sm py-2 px-3 h-10"
                  dropdownClassName="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 divide-y divide-zinc-100 dark:divide-zinc-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <Table className="min-w-[900px] md:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="font-extrabold pl-6 text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">สินค้า</TableHead>
              <TableHead className="font-extrabold text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">หมวดหมู่</TableHead>
              <TableHead className="font-extrabold text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">แบรนด์</TableHead>
              <TableHead className="font-extrabold text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">ราคา</TableHead>
              <TableHead className="font-extrabold text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">คงเหลือ</TableHead>
              <TableHead className="font-extrabold text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">สถานะ</TableHead>
              <TableHead className="font-extrabold text-sm uppercase tracking-wider text-right pr-6 text-zinc-700 dark:text-zinc-300">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <ProductRowSkeleton key={idx} />
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-red-500 font-semibold">{error}</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400">ไม่พบสินค้าที่ตรงกับการค้นหา</TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((p) => {
                const available = p.stock - p.reserved;
                const lowStock = p.status === "active" && available <= 0.3 * p.maxCapacity && available > 0;
                const sc = statusConfig[p.status];
                return (
                  <TableRow key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-zinc-400">{p.brand.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{p.name}</div>
                          <div className="text-xs text-zinc-400 font-mono mt-0.5">SKU: {p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-zinc-750 dark:text-zinc-300">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-900 dark:text-zinc-300 font-bold">{p.brand}</TableCell>
                    <TableCell className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      ฿{Number(p.price).toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <StockBar stock={p.stock} reserved={p.reserved} />
                      {lowStock && (
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-bold mt-0.5 block">⚠ สต็อกใกล้หมด</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-sm px-2.5 py-1 font-bold border-none flex items-center gap-1.5 w-fit ${lowStock ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lowStock ? "bg-amber-500" : sc.dot}`} />
                        {lowStock ? "สต็อกใกล้หมด" : sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-3 py-1.5 text-sm font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        ดูรายละเอียด
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalEntries={filtered.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={loadData} />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => setEditingProduct(selectedProduct)}
          onSuccess={loadData}
        />
      )}

      {editingProduct && (
        <EditProductModal
          productId={editingProduct.id}
          onClose={() => setEditingProduct(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Product Detail Modal Component
// ─────────────────────────────────────────────────────
interface ProductDetailModalProps {
  product: DisplayProduct;
  onClose: () => void;
  onEdit: () => void;
  onSuccess: () => void;
}

function ProductDetailModal({ product, onClose, onEdit, onSuccess }: ProductDetailModalProps) {
  const { isAdmin } = useUser();
  const { toast, confirm } = useToast();
  const handleDelete = async () => {
    const confirmDelete = await confirm({
      title: "ต้องการลบสินค้า?",
      description: `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${product.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      confirmLabel: "ลบสินค้า",
      cancelLabel: "ยกเลิก",
      variant: "danger",
    });
    if (!confirmDelete) return;

    try {
      await deleteProductById(product.id);
      toast({ type: "success", title: "ลบสินค้าเรียบร้อยแล้ว" });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ type: "error", title: "ไม่สามารถลบสินค้าได้", description: err.message ?? "เกิดข้อผิดพลาดในการลบสินค้า" });
    }
  };

  const statusLabels: Record<string, string> = {
    active: "เปิดใช้งาน / พร้อมขาย",
    inactive: "ปิดใช้งานชั่วคราว",
    discontinued: "ยกเลิกการผลิต",
    out_of_stock: "สินค้าหมดสต็อก",
  };

  const skillLabels: Record<string, string> = {
    beginner: "ผู้เริ่มต้น (Beginner)",
    intermediate: "ระดับกลาง (Intermediate)",
    advanced: "ระดับสูง (Advanced)",
    "ไม่ระบุระดับ": "ไม่ระบุระดับ",
  };

  const primaryImage = product.images?.find((img: any) => img.isPrimary)?.imageUrl ||
                       product.images?.[0]?.imageUrl ||
                       "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&auto=format&fit=crop&q=60";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold">รายละเอียดสินค้า</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{product.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Main Info with Image */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-32 h-32 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center shrink-0">
              <img src={primaryImage} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold leading-tight">{product.name}</h4>
              <p className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-505 dark:text-zinc-400 px-2 py-0.5 rounded w-fit">SKU: {product.sku}</p>
              <p className="text-2xl font-black text-amber-500">฿{Number(product.price).toLocaleString("th-TH")}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-200 dark:border-zinc-800 py-4 text-sm">
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">หมวดหมู่</span>
              <span className="font-bold">{product.category}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">แบรนด์ / ยี่ห้อ</span>
              <span className="font-bold">{product.brand}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">สถานะ</span>
              <span className="font-bold">{statusLabels[product.status] || product.status}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold block mb-0.5">ระดับความยาก</span>
              <span className="font-bold">{skillLabels[product.skillLevel || ""] || product.skillLevel}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-sm">
            <span className="text-xs text-zinc-400 font-semibold block">คำอธิบายสินค้า</span>
            <p className="text-zinc-650 dark:text-zinc-350 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800/50">
              {product.description}
            </p>
          </div>

          {/* Stock Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider">สต็อกรวม</span>
              <p className="text-xl font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">{product.stock}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider">จองสินค้า</span>
              <p className="text-xl font-extrabold text-zinc-500 mt-1">{product.reserved}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <span className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider">พร้อมส่ง</span>
              <p className="text-xl font-extrabold text-emerald-500 mt-1">{Math.max(0, product.stock - product.reserved)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 items-center">
          {isAdmin && (
            <>
              <button
                onClick={handleDelete}
                className="mr-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                ลบสินค้า
              </button>
              <button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                แก้ไขรายละเอียดสินค้า
              </button>
            </>
          )}
          <button onClick={onClose} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Edit Product Modal Component
// ─────────────────────────────────────────────────────
interface EditProductModalProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProductModal({ productId, onClose, onSuccess }: EditProductModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
    categoryId: "",
    brandId: "",
    imageUrl: "",
    isBeginner: false,
    status: "active" as ProductStatus,
  });

  const [categories, setCategories] = useState<{ categoryId: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ brandId: string; name: string }[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRecord[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [specDefinitions, setSpecDefinitions] = useState<{ definitionId: string; name: string; group: string }[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});

  // Images state
  const [imageItems, setImageItems] = useState<{ id: string; url: string; file?: File; isPrimary: boolean }[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string>("");

  // Recommendations & Search
  const [linkedProducts, setLinkedProducts] = useState<ProductRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductRecord[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<ProductRecord[]>([]);

  const handleBrandChange = async (val: string) => {
    if (val === "add_new") {
      const newName = window.prompt("ระบุชื่อแบรนด์ใหม่ที่ต้องการเพิ่ม:");
      if (newName && newName.trim()) {
        try {
          const res = await createBrand(newName.trim());
          const newBrand = res.brand;
          setBrands(prev => [...prev, newBrand]);
          setForm(prev => ({ ...prev, brandId: newBrand.brandId }));
        } catch (err: any) {
          toast({ type: "error", title: "ไม่สามารถสร้างแบรนด์ได้", description: err.message ?? "เกิดข้อผิดพลาดในการสร้างแบรนด์" });
        }
      }
    } else {
      setForm(prev => ({ ...prev, brandId: val }));
    }
  };

  // Score & suggest related items (reused from AddProductModal)
  const computeSuggestions = useCallback((
    productName: string, 
    catId: string, 
    bId: string, 
    productsList: ProductRecord[], 
    ordersList: any[]
  ) => {
    if (!productsList || productsList.length === 0) return;

    const coPurchaseCounts: Record<string, number> = {};
    for (const order of ordersList) {
      if (Array.isArray(order.items) && order.items.length > 1) {
        const itemIds = order.items.map((it: any) => it.productId);
        for (const id of itemIds) {
          coPurchaseCounts[id] = (coPurchaseCounts[id] || 0) + 1;
        }
      }
    }

    const scored = productsList.map(candidate => {
      let score = 0;
      if (candidate.name.toLowerCase() === productName.toLowerCase() || candidate.productId === productId) {
        return { candidate, score: -100 };
      }
      if (linkedProducts.some(lp => lp.productId === candidate.productId)) {
        return { candidate, score: -100 };
      }

      if (catId && candidate.category?.categoryId === catId) score += 5;
      if (bId && candidate.brand?.brandId === bId) score += 2;

      const nameLower = productName.toLowerCase();
      const candLower = candidate.name.toLowerCase();
      if (nameLower.includes("guitar") || nameLower.includes("กีตาร์")) {
        if (candLower.includes("cable") || candLower.includes("สาย")) score += 10;
        if (candLower.includes("stand") || candLower.includes("ขาตั้ง")) score += 10;
        if (candLower.includes("strap") || candLower.includes("สายสะพาย")) score += 10;
        if (candLower.includes("string") || candLower.includes("สายกีตาร์")) score += 10;
        if (candLower.includes("case") || candLower.includes("กระเป๋า")) score += 10;
      }
      if (nameLower.includes("mic") || nameLower.includes("ไมค์") || nameLower.includes("microphone")) {
        if (candLower.includes("stand") || candLower.includes("ขาตั้ง")) score += 10;
        if (candLower.includes("pop") || candLower.includes("กันลม")) score += 10;
        if (candLower.includes("cable") || candLower.includes("สาย")) score += 10;
      }

      const orderFreq = coPurchaseCounts[candidate.productId] ?? 0;
      score += orderFreq * 3;

      return { candidate, score };
    });

    const suggestions = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.candidate)
      .slice(0, 4);

    setSmartSuggestions(suggestions);
  }, [linkedProducts, productId]);

  useEffect(() => {
    async function loadMetaAndDetails() {
      try {
        setIsLoadingDetails(true);
        const [catRes, brandRes, prodRes, orderRes, detailRes] = await Promise.all([
          getCategories(),
          getBrands(),
          getProducts({ limit: 100 }),
          getOrders({ limit: 100 }).catch(() => ({ orders: [] })),
          getProductById(productId),
        ]);

        setCategories(catRes.categories ?? []);
        setBrands(brandRes.brands ?? []);
        setAllProducts(prodRes.products ?? []);
        setRecentOrders(orderRes.orders ?? []);

        // Pre-fill fields from fetched details
        const p = detailRes;
        setForm({
          name: p.name,
          sku: p.sku,
          price: String(p.price),
          description: p.description ?? "",
          categoryId: p.category?.categoryId ?? "",
          brandId: p.brand?.brandId ?? "",
          imageUrl: "",
          isBeginner: p.skillLevel === "beginner",
          status: p.status as ProductStatus,
        });

        // Map images
        const mappedImages = p.images.map(img => ({
          id: img.imageId,
          url: img.imageUrl,
          isPrimary: img.isPrimary,
        }));
        setImageItems(mappedImages);
        if (mappedImages[0]) setActiveImageUrl(mappedImages[0].url);

        // Pre-fill recommendations
        const recList = (p.recommendations ?? []).map((r: any) => r.recommended).filter(Boolean);
        setLinkedProducts(recList);

        // Compute smart suggestions initially
        computeSuggestions(p.name, p.category?.categoryId, p.brand?.brandId, prodRes.products ?? [], orderRes.orders ?? []);

        // Load specifications
        const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
        const specRes = await fetch(`${apiBase}/products/categories/${p.category?.categoryId}/specifications`, {
          headers: {
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
          }
        });
        if (specRes.ok) {
          const specData = await specRes.json();
          setSpecDefinitions(specData.specifications ?? []);

          // Map existing product specification values
          const initialValues: Record<string, string> = {};
          if (Array.isArray(p.specifications)) {
            p.specifications.forEach((s: any) => {
              initialValues[s.definition?.definitionId || s.definitionId] = s.value;
            });
          }
          setSpecValues(initialValues);
        }
      } catch (e: any) {
        setError(e.message ?? "ไม่สามารถดึงข้อมูลรายละเอียดสินค้าได้");
      } finally {
        setIsLoadingDetails(false);
      }
    }
    loadMetaAndDetails();
  }, [productId]);

  useEffect(() => {
    if (!isLoadingDetails && allProducts.length > 0) {
      computeSuggestions(form.name, form.categoryId, form.brandId, allProducts, recentOrders);
    }
  }, [form.name, form.categoryId, form.brandId, allProducts, recentOrders, isLoadingDetails]);

  useEffect(() => {
    // Only load specs on manual category change, not initial loading
    if (isLoadingDetails || !form.categoryId) return;

    async function loadSpecsOnChange() {
      try {
        const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
        const res = await fetch(`${apiBase}/products/categories/${form.categoryId}/specifications`, {
          headers: {
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSpecDefinitions(data.specifications ?? []);
          setSpecValues({});
        }
      } catch (err) {
        console.error("Failed to load specs for category change", err);
      }
    }

    loadSpecsOnChange();
  }, [form.categoryId, isLoadingDetails]);

  // Search autocomplete for manual links
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = allProducts.filter(p => 
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.sku.toLowerCase().includes(searchQuery.toLowerCase())) &&
        p.productId !== productId &&
        !linkedProducts.some(lp => lp.productId === p.productId)
      );
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allProducts, linkedProducts, productId]);

  const handleLinkProduct = (prod: ProductRecord) => {
    setLinkedProducts(prev => {
      if (prev.some(p => p.productId === prod.productId)) return prev;
      return [...prev, prod];
    });
    setSearchQuery("");
  };

  const handleUnlinkProduct = (prodId: string) => {
    setLinkedProducts(prev => prev.filter(p => p.productId !== prodId));
  };

  // Image Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems = files.map((file, idx) => {
        const url = URL.createObjectURL(file);
        return {
          id: `local-${Math.random()}-${idx}`,
          url,
          file,
          isPrimary: imageItems.length === 0 && idx === 0,
        };
      });
      setImageItems(prev => {
        const updated = [...prev, ...newItems];
        if (newItems[0]) setActiveImageUrl(newItems[0].url);
        return updated;
      });
    }
  };

  const handleAddUrl = () => {
    if (!form.imageUrl.trim()) return;
    const newItem = {
      id: `url-${Math.random()}`,
      url: form.imageUrl.trim(),
      isPrimary: imageItems.length === 0,
    };
    setImageItems(prev => {
      const updated = [...prev, newItem];
      setActiveImageUrl(newItem.url);
      return updated;
    });
    setForm(prev => ({ ...prev, imageUrl: "" }));
  };

  const handleAddPreset = (url: string) => {
    const newItem = {
      id: `preset-${Math.random()}`,
      url,
      isPrimary: imageItems.length === 0,
    };
    setImageItems(prev => {
      const updated = [...prev, newItem];
      setActiveImageUrl(newItem.url);
      return updated;
    });
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      const wasActive = prev.find(item => item.id === id)?.url === activeImageUrl;
      if (wasActive) {
        setActiveImageUrl(filtered[0]?.url || "");
      }
      return filtered;
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.price) {
      setError("กรุณากรอกข้อมูลที่จำเป็น: ชื่อสินค้า, SKU และราคา");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const hasLocalFiles = imageItems.some(item => item.file);

      const formattedSpecifications = Object.entries(specValues)
        .filter(([_, val]) => val.trim() !== "")
        .map(([defId, val]) => ({ definitionId: defId, value: val }));

      if (hasLocalFiles) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("sku", form.sku);
        fd.append("price", form.price);
        fd.append("description", form.description);
        fd.append("categoryId", form.categoryId);
        fd.append("brandId", form.brandId);
        fd.append("skillLevel", form.isBeginner ? "beginner" : "");
        fd.append("status", form.status);
        fd.append("recommendations", JSON.stringify(linkedProducts.map(p => p.productId)));
        fd.append("specifications", JSON.stringify(formattedSpecifications));

        // Append File objects
        imageItems.forEach(item => {
          if (item.file) {
            fd.append("images", item.file);
          }
        });

        // Append non-file URLs
        const urlImages = imageItems.filter(item => !item.file).map((item, idx) => ({
          imageUrl: item.url,
          isPrimary: idx === 0,
          sortOrder: idx
        }));
        if (urlImages.length > 0) {
          fd.append("images", JSON.stringify(urlImages));
        }

        await updateProduct(productId, fd);
      } else {
        const urlImages = imageItems.map((item, idx) => ({
          imageUrl: item.url,
          isPrimary: idx === 0,
          sortOrder: idx
        }));

        await updateProduct(productId, {
          name: form.name,
          sku: form.sku,
          price: Number(form.price),
          description: form.description || undefined,
          categoryId: form.categoryId || undefined,
          brandId: form.brandId || undefined,
          skillLevel: form.isBeginner ? "beginner" : null,
          status: form.status,
          images: urlImages,
          recommendations: linkedProducts.map(p => p.productId),
          specifications: formattedSpecifications
        });
      }

      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message ?? "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสินค้า");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-[#2a2a2d] rounded-2xl p-8 flex items-center gap-3 text-zinc-650 dark:text-zinc-300">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          กำลังโหลดรายละเอียดสินค้าสำหรับแก้ไข...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-[#2a2a2d] rounded-2xl max-w-4xl w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden max-h-[92vh] h-[90vh] text-zinc-900 dark:text-[#e5e1e6] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-[#2a2a2d]">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">แก้ไขรายละเอียดสินค้า</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">แก้ไขข้อมูลสินค้าและอัปเดตระบบสต็อกคลังสินค้า</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors p-1 bg-zinc-100 dark:bg-zinc-800/40 rounded-lg border border-zinc-250/50 dark:border-zinc-700/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              แก้ไขรายละเอียดสินค้าและบันทึกข้อมูลเสร็จสิ้นแล้ว!
            </div>
          )}

          {/* Top Section: Core Details & Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">ชื่อสินค้า *</label>
                  <input
                    type="text"
                    placeholder="เช่น Fender Player Stratocaster"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">รหัสสินค้า (SKU) *</label>
                  <input
                    type="text"
                    placeholder="เช่น FEN-PLAY-STRAT"
                    value={form.sku}
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Custom Category Dropdown */}
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">หมวดหมู่ *</label>
                  <CustomSelect
                    value={form.categoryId}
                    onChange={(val) => setForm(prev => ({ ...prev, categoryId: val }))}
                    options={categories.map(c => ({ value: c.categoryId, label: c.name }))}
                    placeholder="เลือกหมวดหมู่..."
                    triggerClassName="bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 py-3 h-11"
                    dropdownClassName="bg-white dark:bg-[#2a2a2d] border-zinc-200 dark:border-[#2a2a2d] text-zinc-900 dark:text-white divide-y divide-zinc-100 dark:divide-zinc-800"
                  />
                </div>

                {/* Custom Brand Dropdown */}
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">แบรนด์ *</label>
                  <CustomSelect
                    value={form.brandId}
                    onChange={handleBrandChange}
                    options={[
                      ...brands.map(b => ({ value: b.brandId, label: b.name })),
                      { value: "add_new", label: "+ เพิ่มแบรนด์ใหม่..." }
                    ]}
                    placeholder="เลือกแบรนด์..."
                    triggerClassName="bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 py-3 h-11"
                    dropdownClassName="bg-white dark:bg-[#2a2a2d] border-zinc-200 dark:border-[#2a2a2d] text-zinc-900 dark:text-white divide-y divide-zinc-100 dark:divide-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">ราคา (บาท) *</label>
                  <input
                    type="text"
                    placeholder="เช่น 32,000"
                    value={formatNumberWithCommas(form.price)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const raw = val.replace(/,/g, "");
                      if (raw === "" || Number(raw) >= 0) {
                        setForm(prev => ({ ...prev, price: raw }));
                      }
                    }}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">สถานะ *</label>
                  <CustomSelect
                    value={form.status}
                    onChange={(val) => setForm(prev => ({ ...prev, status: val as ProductStatus }))}
                    options={[
                      { value: "active", label: "มีสินค้า / เปิดใช้งาน" },
                      { value: "inactive", label: "ปิดใช้งาน" },
                      { value: "out_of_stock", label: "สินค้าหมด" },
                      { value: "discontinued", label: "ยกเลิกผลิต" }
                    ]}
                    triggerClassName="bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 py-3 h-11 text-sm font-semibold"
                    dropdownClassName="bg-white dark:bg-[#2a2a2d] border-zinc-200 dark:border-[#2a2a2d] text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-500 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block mb-1.5">คำอธิบาย</label>
                <textarea
                  placeholder="คำอธิบายสินค้า..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all resize-none"
                />
              </div>

              {/* Checkbox for Beginner */}
              <div className="flex items-start gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer select-none" onClick={() => setForm(prev => ({ ...prev, isBeginner: !prev.isBeginner }))}>
                <div className={`mt-2 w-8 h-5 rounded border flex items-center justify-center transition-all ${form.isBeginner ? "bg-amber-500 border-amber-500 text-white" : "border-zinc-300 dark:border-zinc-650 bg-white dark:bg-zinc-900"}`}>
                  {form.isBeginner && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">แนะนำสำหรับมือใหม่</span>
                  <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-1">ติ๊กเลือกหากสินค้าชิ้นนี้เหมาะสำหรับมือใหม่ เพื่อเพิ่มป้ายแนะนำและช่วยการค้นหาในหน้าแสดงสินค้าของลูกค้า</p>
                </div>
              </div>
            </div>

            {/* Right: Media Upload */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-550 dark:text-[#c4c5d9] tracking-[0.7px] uppercase block">รูปภาพสินค้า *</label>
              
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="edit-product-image-file-input"
                onChange={handleFileChange}
              />
              <div 
                onClick={() => document.getElementById("edit-product-image-file-input")?.click()}
                className="bg-zinc-50 dark:bg-[rgba(42,42,45,0.5)] border-2 border-zinc-250 dark:border-zinc-700 border-dashed rounded-xl h-[220px] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden cursor-pointer hover:border-amber-500 transition-colors group"
              >
                {activeImageUrl ? (
                  <>
                    <img src={activeImageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-700">อัปเดตไฟล์ภาพอื่น</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex justify-center text-zinc-400 dark:text-zinc-505 group-hover:text-amber-505 transition-colors">
                      <Plus className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง</p>
                      <p className="text-xs text-zinc-450 dark:text-zinc-505 mt-1">หรือระบุลิงก์ / คลิก Preset ด้านล่างเพื่อเพิ่ม</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Paste URL Area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="วาง Link รูปภาพสินค้าตรงนี้ (URL)..."
                  value={form.imageUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="flex-1 px-4 py-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-450 dark:placeholder:text-zinc-505 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="px-4 py-2 text-xs font-bold bg-[#ff8a3d] text-white rounded-lg hover:bg-[#ff8a3d]/90 transition-colors shrink-0 cursor-pointer"
                >
                  เพิ่มรูป
                </button>
              </div>

              {/* Added Images Gallery */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-zinc-505 tracking-wider uppercase block">รูปภาพสินค้า ({imageItems.length})</span>
                {imageItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {imageItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveImageUrl(item.url)}
                        className={`group relative w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${activeImageUrl === item.url ? "border-amber-500 scale-95 shadow-lg shadow-amber-500/10" : "border-zinc-200 dark:border-zinc-750 hover:border-zinc-450 dark:hover:border-zinc-505"}`}
                      >
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(item.id, e)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-650 z-10 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-450 dark:text-zinc-505 italic">ยังไม่ได้เลือกรูปภาพ</p>
                )}
              </div>

              {/* Preset images */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-550 dark:text-zinc-505 tracking-wider uppercase block mb-2">รูปภาพสำเร็จรูป (Presets)</span>
                <div className="grid grid-cols-4 gap-2">
                  {MOCK_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => handleAddPreset(img.url)}
                      className="group relative h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden text-left hover:border-amber-500/50 transition-all cursor-pointer"
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                        <span className="text-[9px] font-bold text-white tracking-tight">{img.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Specifications Section */}
          {specDefinitions.length > 0 && (
            <div className="px-8 py-6 border-t border-zinc-150 dark:border-[#2a2a2d]">
              <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white">
                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                <h4 className="text-lg font-bold">ข้อมูลจำเพาะสินค้า (Product Specifications)</h4>
              </div>
              <p className="text-xs text-zinc-550 dark:text-zinc-450 mb-6">
                กรอกข้อมูลทางเทคนิคของหมวดหมู่นี้เพื่อนำไปเปรียบเทียบสเปกและใช้ตัวกรองค้นหาทางหน้าเว็บลูกค้า
              </p>
              
              {/* Group specs by group name */}
              {Object.entries(
                specDefinitions.reduce((acc, curr) => {
                  const g = curr.group;
                  if (!acc[g]) acc[g] = [];
                  acc[g]!.push(curr);
                  return acc;
                }, {} as Record<string, typeof specDefinitions>)
              ).map(([groupName, defs]) => (
                <div key={groupName} className="mb-6 space-y-3">
                  <h5 className="text-xs font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">{groupName}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defs.map((def) => (
                      <div key={def.definitionId}>
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">{def.name}</label>
                        <input
                          type="text"
                          placeholder={`ระบุ ${def.name}...`}
                          value={specValues[def.definitionId] || ""}
                          onChange={(e) => setSpecValues(prev => ({ ...prev, [def.definitionId]: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-px bg-zinc-150 dark:bg-[#2a2a2d] my-6" />

          {/* Bottom Section: Cross-selling (Frequently Bought Together) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h4 className="text-lg font-bold">สินค้าแนะนำที่ควรซื้อร่วมกัน</h4>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              จัดการสินค้าแนะนำสำหรับสั่งซื้อด้วยกันบ่อยๆ คุณสามารถพิมพ์ค้นหาเพื่อผูกสินค้าเพิ่มเติมได้
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาอุปกรณ์เพื่อเชื่อมโยง..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2d] text-zinc-900 dark:text-white placeholder:text-zinc-450 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-zinc-450" />
                  
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#2a2a2d] border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                      {searchResults.map((prod) => (
                        <button
                          key={prod.productId}
                          onClick={() => handleLinkProduct(prod)}
                          className="w-full px-4 py-2.5 text-left text-xs hover:bg-[#ff8a3d]/20 hover:text-white text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold block truncate">{prod.name}</span>
                            <span className="text-[10px] text-zinc-500">{prod.sku} • {Number(prod.price).toLocaleString("th-TH")} บาท</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="bg-zinc-50 dark:bg-[#2a2a2d]/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-3.5">
                  <span className="text-[12px] font-extrabold text-zinc-505 dark:text-zinc-400 tracking-wider uppercase block">
                    {smartSuggestions.length > 0 ? "แนะนำโดยระบบ (Smart Suggestions)" : "ป้อนชื่อหรือหมวดหมู่ด้านบน"}
                  </span>
                  {smartSuggestions.length > 0 ? (
                    <div className="space-y-2">
                      {smartSuggestions.map((prod) => (
                        <button
                          key={prod.productId}
                          type="button"
                          onClick={() => handleLinkProduct(prod)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-800/60 hover:bg-[#ff8a3d]/15 border border-zinc-200 dark:border-zinc-700/40 text-left text-[11px] transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-505 block truncate">{prod.name}</span>
                            <span className="text-[9px] text-zinc-505">{prod.category?.name} · {Number(prod.price).toLocaleString("th-TH")} บาท</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-505 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-450">ระบบจะทำการสแกนสินค้าพ่วงที่เหมาะสมทันทีเมื่อพิมพ์ชื่อหลัก</p>
                  )}
                </div>
              </div>

              {/* Linked items */}
              <div className="md:col-span-2">
                <span className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-400 tracking-wider uppercase block mb-3">
                  LINKED PRODUCTS ({linkedProducts.length} รายการ)
                </span>
                
                {linkedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {linkedProducts.map((prod) => {
                      const primaryImage = prod.images?.find((img: any) => img.isPrimary)?.imageUrl || 
                                           (prod.images?.[0]?.imageUrl) || 
                                           "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&auto=format&fit=crop&q=60";
                      return (
                        <div
                          key={prod.productId}
                          className="bg-zinc-50 dark:bg-[#2a2a2d] border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3 flex items-center gap-3 relative group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700/35">
                            <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <h5 className="text-xs font-bold text-zinc-850 dark:text-white truncate">{prod.name}</h5>
                            <span className="text-[10px] text-zinc-505 dark:text-zinc-450 block truncate">{prod.sku}</span>
                            <span className="text-xs font-black text-amber-500 mt-0.5 block">{Number(prod.price).toLocaleString("th-TH")} บาท</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnlinkProduct(prod.productId)}
                            className="absolute top-2 right-2 text-zinc-450 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[180px] border border-zinc-250 dark:border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 bg-zinc-50 dark:bg-zinc-900/10">
                    <p className="text-xs text-zinc-505">ไม่มีการเชื่อมโยงสินค้าแนะนำใดๆ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-zinc-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1f1f22] flex gap-3 justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-750 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || success}
            className="px-8 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
