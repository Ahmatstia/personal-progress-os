"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Icon, type IconName } from "./Icon";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
};

const ToastContext = createContext<{
  toast: (message: string, tone?: Toast["tone"]) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const toneStyles: Record<Toast["tone"], { icon: IconName; cls: string }> = {
  success: { icon: "check", cls: "text-success-600" },
  error: { icon: "alert", cls: "text-danger-600" },
  info: { icon: "info", cls: "text-info-600" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 sm:bottom-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-in-soft pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border border-surface-200 bg-surface-0 px-4 py-3 text-sm font-medium text-surface-800 shadow-raised"
          >
            <Icon name={toneStyles[t.tone].icon} size={18} className={toneStyles[t.tone].cls} />
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
