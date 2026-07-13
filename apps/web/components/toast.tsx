"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface ToastMessage {
  id: string;
  message: string;
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      const message = customEvent.detail?.message || "ทำรายการสำเร็จ";
      
      setToast({
        id: Math.random().toString(),
        message,
      });
    };

    window.addEventListener("mg_show_toast" as any, handleShowToast);
    return () => {
      window.removeEventListener("mg_show_toast" as any, handleShowToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2.5 bg-stone-900 text-white text-[13px] font-medium px-4 py-3 rounded-lg shadow-lg border border-stone-800 min-w-[280px]">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-800 text-emerald-400">
          <Check className="h-3 w-3 stroke-[3]" />
        </div>
        <p className="flex-1">{toast.message}</p>
      </div>
    </div>
  );
}

export function showToast(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mg_show_toast", { detail: { message } })
    );
  }
}
