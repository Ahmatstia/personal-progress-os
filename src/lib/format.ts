export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 60) return `${total} mnt`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (rest === 0) return `${hours}j`;
  return `${hours}j ${rest}mnt`;
}

export function formatHours(hours: number): string {
  return formatDuration(hours * 60);
}