import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/components/LogoutButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatRow } from "@/app/components/ui/StatRow";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(value);
}

export default async function SettingsPage() {
  const user = await requirePageUser();

  const [goalCount, taskCount, sessionCount] = await Promise.all([
    prisma.goal.count({ where: { userId: user.id } }),
    prisma.task.count({ where: { stage: { goal: { userId: user.id } } } }),
    prisma.session.count({ where: { userId: user.id } }),
  ]);

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
        <ul className="mt-5 divide-y divide-surface-150">
          <li className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm font-medium text-surface-800">Bahasa aplikasi</span>
            <span className="text-sm text-surface-500">Indonesia</span>
          </li>
          <li className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm font-medium text-surface-800">Mode tampilan</span>
            <span className="text-sm text-surface-500">Terang</span>
          </li>
        </ul>
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