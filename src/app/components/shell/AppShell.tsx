"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../ui/Icon";
import { AICommandPanel } from "../AICommandPanel";
import { Sidebar, isActive } from "./Sidebar";
import { useFocusMode } from "../focus-mode-store";

type GlobalAIDrawerProps = {
  open: boolean;
  onClose: () => void;
  context?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string };
};

export function GlobalAIDrawer({ open, onClose, context }: GlobalAIDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-surface-950/30 p-4 pt-16 backdrop-blur-sm sm:pt-24"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Asisten AI"
    >
      <div className="animate-in-scale w-full max-w-xl rounded-2xl border border-surface-200 bg-white p-5 shadow-pop">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-ai-600 to-primary-600 text-white">
              <Icon name="sparkles" size={14} />
            </span>
            <span className="text-sm font-bold gradient-text">Asisten AI</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup asisten"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-all"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <AICommandPanel initialContext={context} className="border-0 bg-transparent p-0 shadow-none" />
      </div>
    </div>
  );
}

const mobileNav: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Beranda", icon: "compass" },
  { href: "/today", label: "Hari Ini", icon: "sun" },
  { href: "/goals", label: "Goals", icon: "flag" },
  { href: "/dashboard", label: "Analitik", icon: "chart" },
  { href: "/review", label: "Refleksi", icon: "capture" },
];

export function AppShell({
  user,
  context,
  children,
}: {
  user: { name?: string | null };
  context?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const focusMode = useFocusMode();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAiOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showSearchCta =
    !isActive("/", pathname) &&
    !isActive("/today", pathname) &&
    !isActive("/goals", pathname) &&
    !isActive("/dashboard", pathname);

  const chromeClass = focusMode
    ? "bg-white/70 border-surface-150/60 backdrop-blur-md"
    : "bg-white/85 border-surface-150 backdrop-blur-md";

  return (
    <div className="min-h-screen canvas-bg text-surface-900">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden w-60 border-r px-3 py-5 transition-colors duration-300 lg:block ${
          focusMode
            ? "border-surface-150/50 bg-white/60 backdrop-blur"
            : "border-surface-150 bg-white/90 backdrop-blur-sm"
        }`}
      >
        <Sidebar user={user} />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-surface-950/30 backdrop-blur-sm lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSidebarOpen(false);
          }}
        >
          <div className="h-full w-64 bg-white p-4 shadow-pop">
            <Sidebar user={user} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header
          className={`sticky top-0 z-30 border-b transition-all duration-300 ${chromeClass}`}
        >
          <div className="mx-auto flex h-13 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 lg:hidden transition-all"
              aria-label="Buka menu"
            >
              <Icon name="menu" size={18} />
            </button>

            {/* Logo mobile */}
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-ai-600 text-white">
                <Icon name="sparkles" size={14} />
              </span>
              <span className="text-sm font-bold tracking-tight text-surface-900">
                My<span className="gradient-text">Life</span>
              </span>
            </Link>

            <div className="flex-1" />

            {/* AI trigger — contextual search bar */}
            <button
              onClick={() => setAiOpen(true)}
              aria-label="Buka asisten AI"
              title="Tanya apa saja (⌘K)"
              className={`group inline-flex h-8 items-center gap-2 rounded-xl border border-surface-200 bg-white/90 px-3 text-[13px] font-medium text-surface-500 transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 hover:shadow-[var(--shadow-glow-primary)] ${
                showSearchCta ? "" : "lg:min-w-[240px]"
              }`}
            >
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-gradient-to-br from-ai-600 to-primary-600 text-white">
                <Icon name="sparkles" size={10} />
              </span>
              <span className={showSearchCta ? "" : "hidden lg:inline"}>
                Tanya apa saja…
              </span>
              {!showSearchCta && (
                <span className="ml-auto hidden rounded-md border border-surface-200 bg-surface-50 px-1.5 py-0.5 text-[10px] text-surface-400 lg:inline">
                  ⌘K
                </span>
              )}
            </button>

            {/* Quick capture */}
            <Link
              href="/today"
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 lg:flex transition-all"
              aria-label="Catat cepat"
              title="Catat cepat"
            >
              <Icon name="capture" size={16} />
            </Link>
            <Link
              href="/settings"
              className={`hidden h-8 w-8 items-center justify-center rounded-lg lg:flex transition-all ${
                isActive("/settings", pathname)
                  ? "bg-surface-100 text-surface-800"
                  : "text-surface-400 hover:bg-surface-100 hover:text-surface-700"
              }`}
              aria-label="Pengaturan"
            >
              <Icon name="settings" size={16} />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — floating pill */}
      <nav
        className={`fixed inset-x-4 bottom-4 z-40 rounded-2xl border shadow-pop pb-[max(0px,env(safe-area-inset-bottom))] transition-all duration-300 lg:hidden ${
          focusMode
            ? "border-surface-150/60 bg-white/75 backdrop-blur-md"
            : "border-surface-150 bg-white/95 backdrop-blur-md"
        }`}
        aria-label="Navigasi utama"
      >
        <div className="flex items-stretch justify-around px-1 py-1">
          {mobileNav.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-surface-400 hover:text-surface-700"
                }`}
              >
                <Icon name={item.icon} size={19} />
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary-500"
                  />
                )}
              </Link>
            );
          })}
          <button
            onClick={() => setAiOpen(true)}
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold text-ai-600 hover:bg-ai-50 transition-all"
          >
            <Icon name="sparkles" size={19} />
            Asisten
          </button>
        </div>
      </nav>

      <GlobalAIDrawer open={aiOpen} onClose={() => setAiOpen(false)} context={context} />
    </div>
  );
}