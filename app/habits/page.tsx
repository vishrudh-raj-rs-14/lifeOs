"use client";
import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { todayStr } from "@/lib/utils";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import { Moon, Briefcase, Salad, BookOpen, BookMarked, Check, ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface DailyHabit {
  id: number;
  date: string;
  habit: string;
  value: number;
  notes: string | null;
}

interface HabitConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  inputType: "number" | "toggle";
  unit: string;
  placeholder: string;
  targetLabel: string;
  targetCheck: (v: number) => boolean;
  color: string;
  accentBg: string;
  accentBorder: string;
}

const HABITS: HabitConfig[] = [
  {
    key: "sleep",
    label: "Sleep",
    description: "Hours slept last night",
    icon: <Moon size={18} />,
    inputType: "number",
    unit: "hrs",
    placeholder: "7.5",
    targetLabel: "Goal: 7h+",
    targetCheck: (v) => v >= 7,
    color: "rgb(96,165,250)",
    accentBg: "rgba(96,165,250,0.08)",
    accentBorder: "rgba(96,165,250,0.2)",
  },
  {
    key: "project",
    label: "Project Work",
    description: "Minutes worked on personal project",
    icon: <Briefcase size={18} />,
    inputType: "number",
    unit: "min",
    placeholder: "60",
    targetLabel: "Any time counts",
    targetCheck: (v) => v > 0,
    color: "rgb(251,191,36)",
    accentBg: "rgba(251,191,36,0.07)",
    accentBorder: "rgba(251,191,36,0.2)",
  },
  {
    key: "whole_foods",
    label: "Whole Foods",
    description: "% of meals that were whole foods",
    icon: <Salad size={18} />,
    inputType: "number",
    unit: "%",
    placeholder: "90",
    targetLabel: "Goal: 90%+",
    targetCheck: (v) => v >= 90,
    color: "rgb(52,211,153)",
    accentBg: "rgba(52,211,153,0.07)",
    accentBorder: "rgba(52,211,153,0.2)",
  },
  {
    key: "tech_reading",
    label: "Tech Reading",
    description: "Read tech articles, docs, or papers today",
    icon: <BookOpen size={18} />,
    inputType: "toggle",
    unit: "",
    placeholder: "",
    targetLabel: "Done or not",
    targetCheck: (v) => v > 0,
    color: "rgb(167,139,250)",
    accentBg: "rgba(139,92,246,0.08)",
    accentBorder: "rgba(139,92,246,0.2)",
  },
  {
    key: "nonfiction",
    label: "Non-Fiction",
    description: "Read non-fiction book or content today",
    icon: <BookMarked size={18} />,
    inputType: "toggle",
    unit: "",
    placeholder: "",
    targetLabel: "Done or not",
    targetCheck: (v) => v > 0,
    color: "rgb(251,146,60)",
    accentBg: "rgba(251,146,60,0.07)",
    accentBorder: "rgba(251,146,60,0.2)",
  },
];

function streak(history: DailyHabit[], habitKey: string, targetCheck: (v: number) => boolean): number {
  let count = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const dateStr = format(d, "yyyy-MM-dd");
    const entry = history.find((h) => h.habit === habitKey && h.date.slice(0, 10) === dateStr);
    if (entry && targetCheck(entry.value)) {
      count++;
      d = subDays(d, 1);
    } else {
      break;
    }
  }
  return count;
}

export default function HabitsPage() {
  const [date, setDate] = useState(todayStr());
  const [habits, setHabits] = useState<Record<string, number | null>>({});
  const [history, setHistory] = useState<DailyHabit[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [dayRes, histRes] = await Promise.all([
      fetch(`/api/habits?date=${date}`),
      fetch(`/api/habits?date=${date}&history=true`),
    ]);
    const dayData = await dayRes.json();
    const histData = await histRes.json();

    const map: Record<string, number | null> = {};
    const inputs: Record<string, string> = {};
    for (const h of (dayData.habits || [])) {
      map[h.habit] = h.value;
      inputs[h.habit] = h.value.toString();
    }
    setHabits(map);
    setInputValues(inputs);
    setHistory(histData.history || []);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function logHabit(key: string, value: number) {
    setSaving(key);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, habit: key, value }),
    });
    setSaving(null);
    fetchData();
  }

  async function removeHabit(key: string) {
    setSaving(key);
    await fetch("/api/habits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, habit: key }),
    });
    setSaving(null);
    fetchData();
  }

  function shiftDate(days: number) {
    const d = parseISO(date);
    d.setDate(d.getDate() + days);
    setDate(format(d, "yyyy-MM-dd"));
  }

  const isToday = date === todayStr();
  const daysAgo = differenceInDays(new Date(), parseISO(date));
  const dateLabel = isToday
    ? "Today"
    : daysAgo === 1 ? "Yesterday"
    : format(parseISO(date), "MMM d, yyyy");

  const completedCount = HABITS.filter((h) => {
    const val = habits[h.key];
    return val !== undefined && val !== null && h.targetCheck(val);
  }).length;

  return (
    <AppShell>
      <PageHeader
        title="Daily Habits"
        description="Sleep, project time, nutrition, and reading"
      />

      {/* Date nav */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => shiftDate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "rgb(100,100,115)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[15px] font-semibold text-white">{dateLabel}</p>
          {!isToday && (
            <p className="text-[11px] mt-0.5" style={{ color: "rgb(80,80,95)" }}>
              {format(parseISO(date), "EEEE, MMMM d")}
            </p>
          )}
        </div>
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "rgb(100,100,115)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day progress */}
      <div className="mb-8 p-5 rounded-2xl" style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-white">{completedCount} / {HABITS.length} habits done</p>
          {completedCount === HABITS.length && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(52,211,153,0.12)", color: "rgb(52,211,153)" }}>
              Perfect ✓
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedCount / HABITS.length) * 100}%`,
              background: completedCount === HABITS.length
                ? "rgb(52,211,153)"
                : completedCount >= 3 ? "rgb(251,191,36)" : "rgb(139,92,246)",
            }}
          />
        </div>
      </div>

      {/* Habit cards */}
      <div className="space-y-3">
        {HABITS.map((hc) => {
          const logged = habits[hc.key] !== undefined && habits[hc.key] !== null;
          const val = habits[hc.key] ?? null;
          const met = logged && val !== null && hc.targetCheck(val);
          const s = streak(history, hc.key, hc.targetCheck);

          return (
            <div
              key={hc.key}
              className="rounded-2xl p-5 transition-all"
              style={{
                background: met ? hc.accentBg : "rgb(22,22,26)",
                border: `1px solid ${met ? hc.accentBorder : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon + status */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: met ? `${hc.color}22` : "rgba(255,255,255,0.04)",
                    color: met ? hc.color : "rgb(75,75,90)",
                  }}
                >
                  {hc.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-semibold text-white">{hc.label}</p>
                    {s > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "rgb(251,191,36)" }}>
                        <Flame size={11} /> {s}
                      </span>
                    )}
                    {met && (
                      <span className="ml-auto flex items-center gap-1 text-[11px] font-medium" style={{ color: hc.color }}>
                        <Check size={12} /> Done
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] mb-3" style={{ color: "rgb(90,90,105)" }}>{hc.description}</p>

                  {/* Input */}
                  {hc.inputType === "toggle" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => logged ? removeHabit(hc.key) : logHabit(hc.key, 1)}
                        disabled={saving === hc.key}
                        className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                        style={logged
                          ? { background: hc.accentBg, border: `1px solid ${hc.accentBorder}`, color: hc.color }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgb(110,110,125)" }
                        }
                      >
                        {saving === hc.key ? "..." : logged ? "✓ Done today" : "Mark done"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={inputValues[hc.key] ?? ""}
                          onChange={(e) => setInputValues((p) => ({ ...p, [hc.key]: e.target.value }))}
                          placeholder={hc.placeholder}
                          className="w-24 h-9 rounded-xl text-[13px] font-medium text-white text-center pr-1 focus:outline-none transition-all"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          step="0.5"
                          min="0"
                        />
                        {hc.unit && (
                          <span className="ml-2 text-[12px]" style={{ color: "rgb(80,80,95)" }}>{hc.unit}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const v = parseFloat(inputValues[hc.key] || "0");
                          if (!isNaN(v) && v > 0) logHabit(hc.key, v);
                        }}
                        disabled={saving === hc.key || !inputValues[hc.key]}
                        className="h-9 px-4 rounded-xl text-[13px] font-medium transition-all disabled:opacity-40"
                        style={{ background: "rgba(139,92,246,0.15)", color: "rgb(167,139,250)", border: "1px solid rgba(139,92,246,0.2)" }}
                      >
                        {saving === hc.key ? "..." : logged ? "Update" : "Log"}
                      </button>
                      {logged && (
                        <button
                          onClick={() => removeHabit(hc.key)}
                          disabled={saving === hc.key}
                          className="h-9 px-3 rounded-xl text-[12px] transition-all"
                          style={{ color: "rgb(80,80,95)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] mt-2" style={{ color: "rgb(65,65,80)" }}>{hc.targetLabel}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
