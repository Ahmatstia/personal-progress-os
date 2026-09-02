"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "../ui/Icon";

// Navigasi = perjalanan. Setiap bagian sistem diberi kata kerja supaya mudah
// dihafal: TODAY=Do, GOALS=Plan, DASHBOARD=Progress, REVIEW=Reflect,
// SETTINGS=System. Route & label asli tidak berubah (informasi tetap literal).

type NavItem = {
  href: string;
  label: string;
  verb: string;
  icon: IconName;
};

const primaryNav: NavItem[] = [
  { href: "/", label: "Mulai", verb: "Start", icon: "compass" },
  { href: "/today", label: "Hari Ini", verb: "Do", icon: "sun" },
  { href: "/goals", label: "Goals", verb: "Plan", icon: "flag" },
  { href: "/dashboard", label: "Dashboard", verb: "Progress", icon: "chart" },
  { href: "/review", label: "Refleksi", verb: "Reflect", icon: "capture" },
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Lanjut ke beranda walau permintaan logout gagal (cookie dihapus klien).
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-1">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-ai-600 text-white shadow-sm">
          <Icon name="sparkles" size={18} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-surface-900">
            Progress<span className="text-ai-600">OS</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-surface-400">
            Sistem kemajuan
          </span>
        </span>
      </Link>

      {/* Primary nav — jalan utama */}
      <nav aria-label="Navigasi utama" className="mt-7 flex-1 space-y-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-surface-400">
          Jalan utama
        </p>
        {primaryNav.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-800"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute -left-px top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-600"
                />
              )}
              <span className="relative">
                <Icon
                  name={item.icon}
                  size={18}
                  className={active ? "text-primary-600" : "text-surface-400"}
                />
                {active && (
                  <span aria-hidden="true" className="waypoint-pulse absolute -right-1.5 -top-1 h-2 w-2 rounded-full border-2 border-surface-0 bg-primary-600" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  active
                    ? "bg-primary-100 text-primary-700"
                    : "text-surface-400 group-hover:text-surface-500"
                }`}
              >
                {item.verb}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sistem / akun */}
      <div className="mt-4 space-y-1 border-t border-surface-150 pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive("/settings", pathname)
              ? "bg-primary-50 text-primary-800"
              : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
          }`}
        >
          <Icon name="settings" size={18} className="text-surface-400" />
          <span className="min-w-0 flex-1 truncate">Pengaturan</span>
          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400 group-hover:text-surface-500">
            System
          </span>
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