"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

type ToastVariant = "default" | "success" | "error" | "save" | "unsave" | "delete";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 size={14} />,
  error: <AlertCircle size={14} />,
  save: <Bookmark size={13} />,
  unsave: <BookmarkCheck size={13} />,
  delete: <Trash2 size={13} />,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: "border-surface-200 text-text-primary [&_svg]:text-text-secondary",
  success: "border-emerald-100 text-text-primary [&_svg]:text-emerald-500 dark:text-emerald-400",
  error: "border-red-100 text-text-primary [&_svg]:text-red-500 dark:text-red-400",
  save: "border-primary/20 text-text-primary [&_svg]:text-primary",
  unsave: "border-surface-200 text-text-primary [&_svg]:text-text-secondary",
  delete: "border-red-100 text-text-primary [&_svg]:text-red-500 dark:text-red-400",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "default") => {
    idRef.current += 1;
    setToast({ id: idRef.current, message, variant });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className={clsx(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-surface border shadow-lg text-xs font-medium px-4 py-2.5 rounded-full max-w-sm text-center animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none",
            VARIANT_CLASSES[toast.variant],
          )}
        >
          {ICONS[toast.variant]}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be in <ToastProvider>");
  }
  return ctx;
}