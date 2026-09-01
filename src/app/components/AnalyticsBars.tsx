export default function AnalyticsBars({ trends }: { trends: { date: string; learningHours: number; completedTasks: number }[] }) {
  const maxHours = Math.max(...trends.map((item) => item.learningHours), 1);
  const maxTasks = Math.max(...trends.map((item) => item.completedTasks), 1);
  if (trends.every((item) => item.learningHours === 0 && item.completedTasks === 0)) return <p className="text-sm text-slate-500">No activity data yet.</p>;
  return <div className="space-y-3">{trends.slice(-14).map((item) => <div key={item.date} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-xs"><span className="text-slate-500">{item.date.slice(5)}</span><div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${(item.learningHours / maxHours) * 100}%` }} /></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-300" style={{ width: `${(item.completedTasks / maxTasks) * 100}%` }} /></div></div><span className="text-right text-slate-500">{item.learningHours}h / {item.completedTasks}</span></div>)}</div>;
}
