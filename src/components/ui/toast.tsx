"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "default" | "success" | "error" | "info";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  toast: (data: Omit<ToastData, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border-strong bg-surface-overlay",
  success: "border-success/30 bg-success/10",
  error: "border-danger/30 bg-danger/10",
  info: "border-secondary/30 bg-secondary/10",
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const variant = toast.variant ?? "default";
  const Icon = variantIcons[variant];

  return (
    <div
      role="status"
      className={cn(
        "toast-enter pointer-events-auto flex w-full max-w-sm gap-3 rounded-lg border p-4 shadow-lg glass-strong",
        variantStyles[variant],
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5 text-foreground" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-muted">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (data: Omit<ToastData, "id">) => {
      const id = crypto.randomUUID();
      const duration = data.duration ?? 4000;
      setToasts((prev) => [...prev, { ...data, id }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { ToastItem as Toast };
