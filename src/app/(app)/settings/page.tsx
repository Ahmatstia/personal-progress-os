import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/components/LogoutButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(value);
}

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  const [goalCount, taskCount, sessionCount] = await Promise.all([
    prisma.goal.count({ where: { userId: user.id } }),
    prisma.task.count({ where: { stage: { goal: { userId: user.id } } } }),
    prisma.session.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Account"
        description="Manage your account and personal progress data."
      />

      <section className="rounded-3xl border border-surface-200 bg-surface-0 p-6 shadow-soft md:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <Icon name="user" size={26} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-surface-900">{user.name || "Your account"}</h2>
            <p className="text-sm text-surface-500">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 border-t border-surface-150 pt-6 sm:grid-cols-3">
          {[
            { label: "Goals", value: String(goalCount) },
            { label: "Tasks", value: String(taskCount) },
            { label: "Focus sessions", value: String(sessionCount) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface-50 p-4">
              <dt className="text-xs text-surface-500">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-surface-900">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs text-surface-400">Account created {formatDate(user.createdAt)}</p>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-surface-900">Sign out</h2>
            <p className="mt-1 text-sm text-surface-500">End this session on this device.</p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
