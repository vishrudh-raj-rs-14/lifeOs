"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, todayStr } from "@/lib/utils";
import { format, addDays, parseISO } from "date-fns";
import { Target, Flame, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface Goal {
  id: number;
  date: string;
  text: string;
  completed: boolean;
  position: number;
}

interface Streak {
  id: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

interface HeatmapData {
  [date: string]: { total: number; completed: number };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData>({});
  const [viewDate, setViewDate] = useState(todayStr());
  const [goalTexts, setGoalTexts] = useState(["", "", ""]);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = todayStr();
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const isToday = viewDate === today;
  const isTomorrow = viewDate === tomorrow;
  const isFuture = viewDate > today;

  async function fetchData(date: string) {
    const res = await fetch(`/api/goals?date=${date}`);
    const data = await res.json();
    setGoals(data.goals || []);
    setStreak(data.streak);
    setHeatmap(data.heatmap || {});

    if ((data.goals || []).length > 0) {
      setGoalTexts(data.goals.map((g: Goal) => g.text));
      setEditMode(false);
    } else {
      setGoalTexts(["", "", ""]);
      setEditMode(true);
    }
  }

  useEffect(() => { fetchData(viewDate); }, [viewDate]);

  async function handleSaveGoals() {
    const nonEmpty = goalTexts.filter((t) => t.trim());
    if (nonEmpty.length === 0) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: viewDate,
        goals: nonEmpty.map((text, i) => ({ text, position: i + 1 })),
      }),
    });
    setSaving(false);
    fetchData(viewDate);
  }

  async function handleToggle(goal: Goal) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, completed: !goal.completed, date: viewDate }),
    });
    fetchData(viewDate);
  }

  const allDone = goals.length > 0 && goals.every((g) => g.completed);

  // Last 28 days heatmap
  const heatmapDays: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    heatmapDays.push(format(d, "yyyy-MM-dd"));
  }

  return (
    <AppShell>
      <PageHeader title="Daily Goals" description="Set 3 goals nightly, check off during the day" />

      {/* Streak Stats */}
      {streak && (
        <div className="grid grid-cols-2 gap-5 section-gap">
          <StatCard
            label="Current Streak"
            value={String(streak.currentStreak)}
            sub={streak.currentStreak === 1 ? "day" : "days"}
            accent={streak.currentStreak > 0 ? "violet" : "neutral"}
            icon={<Flame size={16} />}
          />
          <StatCard
            label="Best Streak"
            value={String(streak.longestStreak)}
            sub={streak.longestStreak === 1 ? "day" : "days"}
            accent="green"
            icon={<Target size={16} />}
          />
        </div>
      )}

      {/* Date nav */}
      <div
        className="flex items-center gap-3 mb-8 rounded-2xl px-4 py-3"
        style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={() => {
            const d = parseISO(viewDate);
            d.setDate(d.getDate() - 1);
            setViewDate(format(d, "yyyy-MM-dd"));
          }}
          className="p-2 rounded-lg transition-colors hover:bg-white/[0.04]"
          style={{ color: "rgb(90,90,105)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-white">
            {isToday ? "Today" : isTomorrow ? "Tomorrow" : format(parseISO(viewDate), "EEE, MMM d")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgb(90,90,105)" }}>{format(parseISO(viewDate), "yyyy-MM-dd")}</p>
        </div>
        <button
          onClick={() => {
            const d = parseISO(viewDate);
            d.setDate(d.getDate() + 1);
            setViewDate(format(d, "yyyy-MM-dd"));
          }}
          className="p-2 rounded-lg transition-colors hover:bg-white/[0.04]"
          style={{ color: "rgb(90,90,105)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Goals card */}
      <div
        className="rounded-2xl mb-10"
        style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-white">
              {isTomorrow ? "Tomorrow's Goals" : isToday ? "Today's Goals" : format(parseISO(viewDate), "MMM d")}
            </h3>
            {streak && streak.currentStreak > 0 && isToday && (
              <Badge variant="default" className="flex items-center gap-1">
                <Flame size={10} />
                {streak.currentStreak}
              </Badge>
            )}
          </div>
          {goals.length > 0 && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        <div className="px-6 pb-6">
          {editMode || goals.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  placeholder={`Goal ${i + 1}${i === 0 ? " (required)" : " (optional)"}`}
                  value={goalTexts[i] || ""}
                  onChange={(e) => {
                    const updated = [...goalTexts];
                    updated[i] = e.target.value;
                    setGoalTexts(updated);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveGoals()}
                />
              ))}
              <Button variant="primary" onClick={handleSaveGoals} loading={saving} className="w-full">
                Set Goals
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => isToday && handleToggle(g)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                    g.completed
                      ? "border-violet-500/30"
                      : "border-white/[0.06] hover:border-white/[0.1]",
                    !isToday && "cursor-default"
                  )}
                  style={g.completed ? { background: "rgba(139,92,246,0.08)" } : { background: "rgb(16,16,20)" }}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    )}
                    style={
                      g.completed
                        ? { background: "rgb(139,92,246)", borderColor: "rgb(139,92,246)" }
                        : { borderColor: "rgb(55,55,65)" }
                    }
                  >
                    {g.completed && <Check size={12} className="text-white" />}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium flex-1",
                      g.completed ? "line-through" : "text-white/80"
                    )}
                    style={g.completed ? { color: "rgb(90,90,105)" } : undefined}
                  >
                    {g.text}
                  </span>
                </button>
              ))}
              {allDone && (
                <div className="text-center py-3 text-emerald-400 text-sm font-medium animate-fade-in">
                  All goals done! Streak updated.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div
        className="rounded-2xl"
        style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="px-6 pt-5 pb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>
            Last 28 Days
          </p>
        </div>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] pb-1" style={{ color: "rgb(80,80,95)" }}>{d}</div>
            ))}
            {heatmapDays.map((d) => {
              const data = heatmap[d];
              const ratio = data ? data.completed / data.total : 0;
              const color = !data ? "bg-white/[0.03]"
                : ratio === 1 ? "bg-emerald-500/80"
                : ratio >= 0.5 ? "bg-violet-500/50"
                : "bg-red-500/25";
              return (
                <div
                  key={d}
                  title={data ? `${d}: ${data.completed}/${data.total}` : d}
                  className={cn("aspect-square rounded-lg cursor-default", color)}
                />
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgb(90,90,105)" }}>
              <div className="w-3 h-3 rounded-lg bg-emerald-500/80" /> All done
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgb(90,90,105)" }}>
              <div className="w-3 h-3 rounded-lg bg-violet-500/50" /> Partial
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgb(90,90,105)" }}>
              <div className="w-3 h-3 rounded-lg bg-white/[0.03]" /> None
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
