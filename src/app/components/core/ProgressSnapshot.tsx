import { Icon, type IconName } from "../ui/Icon";

type SnapshotItem = {
  label: string;
  value: string;
  icon: IconName;
  hint?: string;
};

export function ProgressSnapshot({
  items,
  title = "Ringkasan progres",
  className = "",
}: {
  items: SnapshotItem[];
  title?: string;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-surface-500">
        {title}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="flex items-center gap-1.5 text-xs text-surface-500">
              <Icon name={item.icon} size={14} className="text-surface-400" />
              {item.label}
            </dt>
            <dd className="mt-1.5 text-2xl font-bold tracking-tight text-surface-900">
              {item.value}
            </dd>
            {item.hint && <dd className="mt-0.5 text-[11px] text-surface-400">{item.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
