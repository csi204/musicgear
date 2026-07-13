"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { toast as sonnerToast, Toaster } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmState extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

const confirmVariant = {
  danger:  { confirm: "bg-red-500 hover:bg-red-600 text-white", icon: <XCircle className="w-10 h-10 text-red-500" /> },
  warning: { confirm: "bg-amber-500 hover:bg-amber-600 text-white", icon: <AlertTriangle className="w-10 h-10 text-amber-500" /> },
  default: { confirm: "bg-amber-500 hover:bg-amber-600 text-white", icon: <Info className="w-10 h-10 text-blue-500" /> },
};

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  const variant = confirmVariant[state.variant ?? "default"];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleResult = (result: boolean) => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      state.resolve(result);
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => handleResult(false)}
      />
      {/* Dialog */}
      <div
        className={`
          relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700
          rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4
          transition-all duration-200
          ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
        `}
      >
        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center gap-3">
          {variant.icon}
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug">
            {state.title}
          </h3>
          {state.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {state.description}
            </p>
          )}
        </div>
        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => handleResult(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {state.cancelLabel ?? "ยกเลิก"}
          </button>
          <button
            onClick={() => handleResult(true)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${variant.confirm}`}
          >
            {state.confirmLabel ?? "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const toast = useCallback((opts: ToastOptions) => {
    const sonnerOpts = {
      description: opts.description,
      duration: opts.duration ?? 4000,
    };

    switch (opts.type) {
      case "success":
        sonnerToast.success(opts.title, sonnerOpts);
        break;
      case "error":
        sonnerToast.error(opts.title, sonnerOpts);
        break;
      case "warning":
        sonnerToast.warning(opts.title, sonnerOpts);
        break;
      case "info":
      default:
        sonnerToast.info(opts.title, sonnerOpts);
        break;
    }
  }, []);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      
      {/* Sonner Toaster */}
      <Toaster richColors position="bottom-right" />

      {/* Confirm Dialog */}
      {confirmState && (
        <ConfirmDialog
          state={confirmState}
          onClose={() => setConfirmState(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
