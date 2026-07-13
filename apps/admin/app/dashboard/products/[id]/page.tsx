"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "../product-form";
import { getProductById, type ProductRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          clearSession();
          router.push("/");
          return;
        }
        const res = await getProductById(resolvedParams.id, token);
        setProduct(res);
      } catch (err: any) {
        setError(err.message ?? "ไม่สามารถดึงข้อมูลสินค้าได้");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [resolvedParams.id, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-zinc-500">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-rose-500">
          <p className="text-xl font-bold mb-2">⚠ เกิดข้อผิดพลาด</p>
          <p>{error || "ไม่พบสินค้า"}</p>
        </div>
      </div>
    );
  }

  return <ProductForm initialData={product} isEdit />;
}
