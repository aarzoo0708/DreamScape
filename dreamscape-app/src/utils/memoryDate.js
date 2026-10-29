// Saved memory dates use midday UTC, but their calendar day is the ISO date
// portion. Preserve that day instead of shifting it through the browser zone.
export function memoryDateKey(memory) {
  const value = memory.dateValue || memory.rawDate || "";
  if (typeof value !== "string" || !value.trim()) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() === Number(month) - 1 && parsed.getUTCDate() === Number(day)
      ? `${year}-${month}-${day}` : null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}
