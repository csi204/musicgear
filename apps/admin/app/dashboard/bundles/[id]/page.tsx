"use client";

import { useEffect, useState } from "react";
import { BundleForm } from "../bundle-form";
import { getBundleById, type BundleRecord } from "@/lib/api";
import { getAccessToken, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";

export default function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [bundle, setBundle] = useState<BundleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          clearSession();
          router.push("/");
          return;
        }
        const res = await getBundleById(resolvedParams.id, token);
        setBundle(res.bundle);
      } catch (err: any) {
        setError(err.message ?? "ไม่สามารถดึงข้อมูลเซ็ตสินค้าได้");
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
  }, [resolvedParams.id, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-zinc-500">กำลังโหลดข้อมูลเซ็ตสินค้า...</p>
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-rose-500">
          <p className="text-xl font-bold mb-2">⚠ เกิดข้อผิดพลาด</p>
          <p>{error || "ไม่พบเซ็ตสินค้า"}</p>
        </div>
      </div>
    );
  }

  return <BundleForm initialData={bundle} isEdit />;
}
