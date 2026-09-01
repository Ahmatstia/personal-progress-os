"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeable = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeable?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeable) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, closeable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-surface-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && closeable) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="animate-in-soft max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface-0 p-6 shadow-pop sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-surface-500">{description}</p>
            )}
          </div>
          {closeable && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-800"
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
        <div className="mt-5">{children}</div>
        {footer && (
          <div className="mt-6 flex justify-end gap-2 border-t border-surface-150 pt-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
