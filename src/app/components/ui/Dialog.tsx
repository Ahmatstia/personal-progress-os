"use client";

import { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";

// Dialog dengan a11y lengkap:
// - focus trap (Tab/Shift+Tab berputar di dalam panel)
// - fokus awal ke input ber-autofocus / input pertama / tombol tutup
// - fokus dikembalikan ke elemen asal saat dialog ditutup
// - aria-labelledby + aria-describedby eksplisit

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
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const focusInside = () => {
      const native =
        panel?.querySelector<HTMLElement>("[autofocus]") ??
        panel?.querySelector<HTMLElement>(
          "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
        );
      if (native && panel?.contains(native)) {
        native.focus();
        return;
      }
      const list = getFocusables();
      const closeButton = panel?.querySelector<HTMLElement>('button[aria-label="Tutup dialog"]');
      (closeButton ?? list[0])?.focus();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeable) {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = getFocusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && panel?.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(focusInside);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
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
      aria-labelledby={titleId}
      aria-describedby={description ? `${titleId}-desc` : undefined}
    >
      <div
        ref={panelRef}
        className="animate-in-soft max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface-0 p-6 shadow-pop sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-surface-900">
              {title}
            </h2>
            {description && (
              <p id={`${titleId}-desc`} className="mt-1 text-sm text-surface-500">
                {description}
              </p>
            )}
          </div>
          {closeable && (
            <button
              onClick={onClose}
              aria-label="Tutup dialog"
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