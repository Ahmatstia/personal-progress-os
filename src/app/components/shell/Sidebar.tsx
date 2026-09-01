"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "../ui/Icon";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

const primaryNav: NavItem[] = [
  { href: "/", label: "Beranda", icon: "sparkles" },
  { href: "/today", label: "Hari Ini", icon: "sun" },
  { href: "/goals", label: "Goals", icon: "flag" },
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
  { href: "/review", label: "Refleksi", icon: "compass" },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  user,
  onNavigate,
}: {
  user: { name?: string | null };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai-600 text-white shadow-sm">
          <Icon name="sparkles" size={18} />
        </span>
        <span className="text-[15px] font-bold tracking-tight text-surface-900">
          Progress<span className="text-ai-600">OS</span>
        </span>
      </Link>

      {/* Primary nav */}
      <nav aria-label="Navigasi utama" className="mt-7 flex-1 space-y-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-surface-400">
          Navigasi
        </p>
        {primaryNav.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              }`}
            >
              <Icon name={item.icon} size={18} className={active ? "text-primary-600" : "text-surface-400"} />
              {item.label}
              {item.href === "/today" && null}
            </Link>
          );
        })}
      </nav>

      {/* Secondary / account */}
      <div className="mt-4 space-y-1 border-t border-surface-150 pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive("/settings", pathname)
              ? "bg-primary-50 text-primary-700"
              : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
          }`}
        >
          <Icon name="settings" size={18} className="text-surface-400" />
          Pengaturan
        </Link>
        <div className="flex items-center justify-between rounded-xl bg-surface-100 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {(user.name || "U").charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-surface-800">
              {user.name || "Akun"}
            </span>
          </div>
          <button
            onClick={logout}
            aria-label="Keluar"
            title="Keluar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-500 transition hover:bg-surface-200 hover:text-danger-600"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
