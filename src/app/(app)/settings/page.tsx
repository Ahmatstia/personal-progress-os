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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pengaturan"
        title="Akun"
        description="Kelola akun dan data progres pribadi Anda."
      />

      <section className="rounded-3xl border border-surface-200 bg-surface-0 p-6 shadow-soft md:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <Icon name="user" size={26} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-surface-900">{user.name || "Akun Anda"}</h2>
            <p className="text-sm text-surface-500">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 border-t border-surface-150 pt-4 sm:grid-cols-3">
          <StatRow icon="flag" label="Goals" value={String(goalCount)} />
          <StatRow icon="layers" tone="primary" label="Task" value={String(taskCount)} />
          <StatRow icon="clock" tone="success" label="Sesi fokus" value={String(sessionCount)} />
        </dl>

        <p className="mt-6 text-xs text-surface-400">Akun dibuat {formatDate(user.createdAt)}</p>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-surface-900">Keluar</h2>
            <p className="mt-1 text-sm text-surface-500">Akhiri sesi ini di perangkat ini.</p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
