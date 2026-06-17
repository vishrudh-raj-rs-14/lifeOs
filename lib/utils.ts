import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfWeek, endOfWeek, format, getWeek, getYear, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCalendarWeekRange(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });   // Sunday
  return { start, end };
}

export function getWeekLabel(date: Date): string {
  const { start, end } = getCalendarWeekRange(date);
  const weekNum = getWeek(date, { weekStartsOn: 1 });
  const year = getYear(date);
  return `W${weekNum} ${year} (${format(start, "MMM d")} – ${format(end, "MMM d")})`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMM d, yyyy");
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMM d");
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getMondayOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function groupByWeek<T extends { date: string | Date }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const d = typeof item.date === "string" ? parseISO(item.date) : item.date;
    const monday = getMondayOfWeek(d);
    const key = format(monday, "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function parseCfUrl(url: string): { contestId: number; index: string } | null {
  try {
    const clean = url.trim().replace(/\/$/, "");
    // Match: /problemset/problem/1234/A or /contest/1234/problem/A
    const m1 = clean.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
    if (m1) return { contestId: parseInt(m1[1]), index: m1[2].toUpperCase() };

    const m2 = clean.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (m2) return { contestId: parseInt(m2[1]), index: m2[2].toUpperCase() };

    // Gym problems: /gym/1234/problem/A
    const m3 = clean.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (m3) return { contestId: parseInt(m3[1]), index: m3[2].toUpperCase() };

    return null;
  } catch {
    return null;
  }
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}
