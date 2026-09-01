"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../ui/Icon";
import { AICommandPanel } from "../AICommandPanel";
import { Sidebar, isActive } from "./Sidebar";

type GlobalAIDrawerProps = {
  open: boolean;
  onClose: () => void;
  context?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string };
};

export function GlobalAIDrawer({ open, onClose, context }: GlobalAIDrawerProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-surface-950/40 p-4 pt-20 backdrop-blur-sm sm:pt-28"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
    >
      <div className="animate-in-soft w-full max-w-xl rounded-3xl border border-surface-200 bg-surface-0 p-5 shadow-pop">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-ai-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-100">
              <Icon name="sparkles" size={16} />
            </span>
            <span className="text-sm font-bold">Assistant</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <AICommandPanel initialContext={context} className="border-0 bg-transparent p-0 shadow-none" />
      </div>
    </div>
  );
}

const mobileNav: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "sparkles" },
  { href: "/today", label: "Today", icon: "sun" },
  { href: "/goals", label: "Goals", icon: "flag" },
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
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

  const showSearchCta = !isActive("/", pathname) && !isActive("/today", pathname) && !isActive("/goals", pathname) && !isActive("/dashboard", pathname);

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-surface-200 bg-surface-0 px-4 py-5 lg:block">
        <Sidebar user={user} />
      </aside>

      {/* Mobile sidebar (drawer) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-surface-950/40 backdrop-blur-sm lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSidebarOpen(false);
          }}
        >
          <div className="h-full w-72 bg-surface-0 p-4">
            <Sidebar user={user} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-surface-200 bg-surface-0/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" size={20} />
            </button>

            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-600 text-white">
                <Icon name="sparkles" size={16} />
              </span>
              <span className="text-sm font-bold tracking-tight">ProgressOS</span>
            </Link>

            <div className="flex-1" />

            {/* AI trigger */}
            <button
              onClick={() => setAiOpen(true)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border border-ai-200 bg-ai-50 px-3 text-sm font-medium text-ai-700 transition hover:bg-ai-100 ${
                showSearchCta ? "" : "lg:min-w-[260px]"
              }`}
            >
              <Icon name="sparkles" size={16} />
              <span className={showSearchCta ? "" : "hidden lg:inline text-ai-600/80"}>
                Ask anything…
              </span>
              {!showSearchCta && (
                <span className="ml-auto hidden rounded border border-ai-200 px-1.5 py-0.5 text-[10px] text-ai-500 lg:inline">
                  ⌘K
                </span>
              )}
            </button>

            {/* Quick capture shortcut */}
            <Link
              href="/today"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 lg:flex"
              aria-label="Quick capture"
              title="Quick capture"
            >
              <Icon name="capture" size={18} />
            </Link>
            <Link
              href="/settings"
              className={`hidden h-10 w-10 items-center justify-center rounded-xl lg:flex ${
                isActive("/settings", pathname)
                  ? "bg-surface-150 text-surface-800"
                  : "text-surface-500 hover:bg-surface-100"
              }`}
              aria-label="Settings"
            >
              <Icon name="settings" size={18} />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-surface-0/95 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
          {mobileNav.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium ${
                  active ? "text-primary-700" : "text-surface-500"
                }`}
              >
                <Icon name={item.icon} size={21} className={active ? "text-primary-600" : ""} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setAiOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium text-ai-700"
          >
            <Icon name="sparkles" size={21} />
            Assistant
          </button>
        </div>
      </nav>

      <GlobalAIDrawer open={aiOpen} onClose={() => setAiOpen(false)} context={context} />
    </div>
  );
}
