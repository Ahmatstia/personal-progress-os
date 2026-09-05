import { requirePageUser } from "@/lib/auth";
import { getUserAccountStats } from "@/services/user.service";
import { getUserPreference } from "@/services/user-preference.service";
import LogoutButton from "@/app/components/LogoutButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatRow } from "@/app/components/ui/StatRow";
import { Icon } from "@/app/components/ui/Icon";
import { UserPreferenceControls } from "./UserPreferenceControls";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(value);
}

export default async function SettingsPage() {
  const user = await requirePageUser();

  const [stats, preference] = await Promise.all([
    getUserAccountStats(user.id),
    getUserPreference(user.id),
  ]);
  const { goalCount, taskCount, sessionCount } = stats;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Pengaturan"
        title="Akun"
        description="Kelola akun dan data progres pribadi Anda."
      />

      <section className="max-w-2xl border-t border-surface-150 pt-8">
        <p className="eyebrow text-surface-400">Profil</p>
        <div className="mt-5 flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <Icon name="user" size={28} />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-surface-900">{user.name || "Akun Anda"}</h2>
            <p className="truncate text-sm text-surface-500">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="max-w-2xl border-t border-surface-150 pt-8">
        <p className="eyebrow text-surface-400">Data Anda</p>
        <dl className="mt-5 grid gap-x-8 sm:grid-cols-3">
          <StatRow icon="flag" label="Goals" value={String(goalCount)} />
          <StatRow icon="layers" tone="primary" label="Task" value={String(taskCount)} />
          <StatRow icon="clock" tone="success" label="Sesi fokus" value={String(sessionCount)} />
        </dl>
        <p className="mt-6 text-xs text-surface-400">Akun dibuat {formatDate(user.createdAt)}</p>
      </section>

      <section className="max-w-2xl border-t border-surface-150 pt-8">
        <p className="eyebrow text-surface-400">Preferensi</p>
        <div className="mt-4">
          <UserPreferenceControls initialPref={preference} />
        </div>
      </section>

      <section className="max-w-2xl border-t border-surface-150 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-primary-600">Kedaulatan Data (Data Sovereignty)</p>
            <h2 className="mt-1 font-semibold text-surface-900">Ekspor Data Pribadi</h2>
            <p className="mt-1 text-xs text-surface-500 max-w-md leading-relaxed">
              Anda memegang kendali penuh atas data Anda. Unduh salinan lengkap seluruh Goal, Task, Sesi, Catatan, Kalender, dan Riwayat Anda dalam format file JSON standar.
            </p>
          </div>
          <a
            href="/api/settings/export"
            download
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-xs font-bold text-surface-800 shadow-xs hover:border-primary-300 hover:text-primary-700 transition"
          >
            <Icon name="arrowRight" size={14} className="rotate-90" />
            Unduh Cadangan JSON
          </a>
        </div>
      </section>

      <section className="max-w-2xl border-t border-surface-150 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-danger-600">Akun</p>
            <h2 className="mt-1 font-semibold text-surface-900">Keluar</h2>
            <p className="mt-1 text-sm text-surface-500">Akhiri sesi ini di perangkat ini.</p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}