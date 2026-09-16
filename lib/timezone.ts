// Indonesia has 3 timezones, all fixed-offset year-round (no DST), so we can
// hardcode the offsets instead of depending on the browser's own timezone.
export type IndonesiaTimezone = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";

export const INDONESIA_TIMEZONES: {
  value: IndonesiaTimezone;
  abbr: "WIB" | "WITA" | "WIT";
  label: string;
  offsetMinutes: number;
}[] = [
  { value: "Asia/Jakarta", abbr: "WIB", label: "WIB — Jakarta (UTC+7)", offsetMinutes: 7 * 60 },
  { value: "Asia/Makassar", abbr: "WITA", label: "WITA — Makassar (UTC+8)", offsetMinutes: 8 * 60 },
  { value: "Asia/Jayapura", abbr: "WIT", label: "WIT — Jayapura (UTC+9)", offsetMinutes: 9 * 60 },
];

export const DEFAULT_TIMEZONE: IndonesiaTimezone = "Asia/Jakarta";

function getOffsetMinutes(timeZone: string): number {
  return (
    INDONESIA_TIMEZONES.find((tz) => tz.value === timeZone)?.offsetMinutes ??
    INDONESIA_TIMEZONES.find((tz) => tz.value === DEFAULT_TIMEZONE)!.offsetMinutes
  );
}

export function getTimezoneAbbr(timeZone: string): string {
  return (
    INDONESIA_TIMEZONES.find((tz) => tz.value === timeZone)?.abbr ??
    INDONESIA_TIMEZONES.find((tz) => tz.value === DEFAULT_TIMEZONE)!.abbr
  );
}

// Treats `datetimeLocalValue` (e.g. "2026-08-26T12:16", from an
// <input type="datetime-local">) as wall-clock digits IN `timeZone` —
// not in the browser's own timezone — and converts to a UTC ISO string.
export function zonedDatetimeLocalToIso(datetimeLocalValue: string, timeZone: string): string {
  const [datePart, timePart] = datetimeLocalValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
  const offsetMinutes = getOffsetMinutes(timeZone);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000;
  return new Date(utcMs).toISOString();
}

// Reverse of zonedDatetimeLocalToIso — renders a UTC ISO string as
// wall-clock digits in `timeZone`, for populating a datetime-local input.
export function isoToZonedDatetimeLocal(isoString: string, timeZone: string): string {
  const offsetMinutes = getOffsetMinutes(timeZone);
  const zonedMs = new Date(isoString).getTime() + offsetMinutes * 60_000;
  const d = new Date(zonedMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
