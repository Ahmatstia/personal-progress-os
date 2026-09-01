export function formatHours(hours: number): string {
  const minutes = Math.round(hours * 60);
  if (minutes < 60) return `${minutes} mnt`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${h}j`;
  return `${h}j ${rest}mnt`;
}