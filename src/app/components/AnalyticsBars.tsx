export default function AnalyticsBars({
  trends,
}: {
  trends: { date: string; learningHours: number; completedTasks: number }[];
}) {
  const maxHours = Math.max(...trends.map((item) => item.learningHours), 1);
  const maxTasks = Math.max(...trends.map((item) => item.completedTasks), 1);
  const hasData = trends.some((item) => item.learningHours > 0 || item.completedTasks > 0);

  if (!hasData) {
    return <p className="py-4 text-sm text-surface-500">Belum ada data aktivitas pada periode ini.</p>;
  }

  return (
    <div className="space-y-3">
      {trends.slice(-14).map((item) => (
        <div key={item.date} className="grid grid-cols-[3.5rem_1fr_5rem] items-center gap-3 text-xs">
          <span className="text-surface-500">{item.date.slice(5)}</span>
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-150">
              <div
                className="h-full rounded-full bg-ai-500"
                style={{ width: `${(item.learningHours / maxHours) * 100}%` }}
                title={`${item.learningHours}j fokus`}
              />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-150">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${(item.completedTasks / maxTasks) * 100}%` }}
                title={`${item.completedTasks} task selesai`}
              />
            </div>
          </div>
          <span className="text-right text-surface-500">
            {item.learningHours}j · {item.completedTasks}
          </span>
        </div>
      ))}
    </div>
  );
}
