"use client";
import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn, todayStr, getMondayOfWeek, formatShortDate } from "@/lib/utils";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";
import { Plus, Trash2, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";

interface GymEntry  { id: number; date: string; didGo: boolean }
interface WorkoutEntry { id: number; date: string; type: string; notes?: string }

const WORKOUT_TYPES = [
  { value: "PUSH",      label: "Push"      },
  { value: "PULL",      label: "Pull"      },
  { value: "LEGS",      label: "Legs"      },
  { value: "UPPER",     label: "Upper"     },
  { value: "LOWER",     label: "Lower"     },
  { value: "FULL_BODY", label: "Full Body" },
  { value: "CARDIO",    label: "Cardio"    },
  { value: "OTHER",     label: "Other"     },
];

const TYPE_COLORS: Record<string, "info" | "success" | "danger" | "warning" | "muted"> = {
  PUSH: "info", PULL: "success", LEGS: "danger",
  UPPER: "info", LOWER: "danger", FULL_BODY: "warning",
  CARDIO: "success", OTHER: "muted",
};

type Tab = "calendar" | "workouts";

export default function GymPage() {
  const [tab, setTab]             = useState<Tab>("calendar");
  const [gymEntries, setGymEntries]     = useState<GymEntry[]>([]);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Workout form state
  const [date,  setDate]  = useState(todayStr());
  const [type,  setType]  = useState("PUSH");
  const [notes, setNotes] = useState("");
  const [savingWorkout, setSavingWorkout] = useState(false);

  const fetchGym = useCallback(async () => {
    const res = await fetch("/api/gym");
    const data = await res.json();
    setGymEntries(data.entries || []);
  }, []);

  const fetchWorkouts = async () => {
    const res = await fetch("/api/workouts");
    const data = await res.json();
    const entries = data.entries || [];
    setWorkoutEntries(entries);
    if (entries.length > 0) {
      const currentWeek = format(getMondayOfWeek(new Date()), "yyyy-MM-dd");
      setExpandedWeeks(new Set([currentWeek]));
    }
  };

  useEffect(() => { fetchGym(); },     [fetchGym]);
  useEffect(() => { fetchWorkouts(); }, []);

  async function handleSaveWorkout() {
    setSavingWorkout(true);
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, type, exercises: [], notes }),
    });
    setSavingWorkout(false);
    setShowModal(false);
    setNotes("");
    fetchGym();
    fetchWorkouts();
  }

  async function handleDeleteWorkout(id: number) {
    await fetch("/api/workouts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchGym();
    fetchWorkouts();
  }

  // ── Derived data ──
  const entriesMap = new Map(gymEntries.map((e) => [e.date, e]));
  const today = todayStr();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const thisWeekGym = gymEntries.filter((e) => {
    const d = parseISO(e.date);
    return d >= weekStart && d <= weekEnd && e.didGo;
  }).length;

  const heatmapData: Record<string, number> = {};
  for (const e of gymEntries) if (e.didGo) heatmapData[e.date] = 1;

  // ── Workout grouping ──
  const weeks = new Map<string, WorkoutEntry[]>();
  for (const e of workoutEntries) {
    const mon = format(getMondayOfWeek(parseISO(e.date)), "yyyy-MM-dd");
    if (!weeks.has(mon)) weeks.set(mon, []);
    weeks.get(mon)!.push(e);
  }
  const sortedWeeks = [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  function toggleWeek(key: string) {
    const s = new Set(expandedWeeks);
    s.has(key) ? s.delete(key) : s.add(key);
    setExpandedWeeks(s);
  }

  return (
    <AppShell>
      <PageHeader
        title="Gym & Workouts"
        description="Track attendance and log your training sessions"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Log Workout
          </Button>
        }
      />

      {/* Week summary */}
      <div className="card-box section-gap">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>
              This Week
            </p>
            <p className="text-xs mt-1" style={{ color: "rgb(120,120,135)" }}>
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
            </p>
          </div>
          <p
            className={cn("text-3xl font-bold tabular-nums tracking-tight",
              thisWeekGym >= 5 ? "text-emerald-400" : thisWeekGym >= 3 ? "text-violet-400" : "text-red-400"
            )}
          >
            {thisWeekGym}<span className="text-base font-medium" style={{ color: "rgb(90,90,108)" }}>/5</span>
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className={cn("h-full rounded-full transition-all duration-500", thisWeekGym >= 5 ? "bg-emerald-500" : "bg-violet-600")}
            style={{ width: `${Math.min(thisWeekGym / 5, 1) * 100}%` }}
          />
        </div>
        {/* Day bubbles — read only, derived from workout log */}
        <div className="flex gap-2">
          {["M","T","W","T","F","S","S"].map((day, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            const key = format(d, "yyyy-MM-dd");
            const entry = entriesMap.get(key);
            const isToday = key === today;
            const isPast = key < today;
            const didGo = entry?.didGo;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 h-10 rounded-lg text-xs font-medium border select-none",
                  "flex items-center justify-center",
                  didGo
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                    : isPast && !isToday
                      ? "bg-red-500/10 border-red-500/20 text-red-400/60"
                      : isToday
                        ? "border-violet-500/30 border-dashed text-[rgb(140,143,155)]"
                        : "border-white/[0.05] text-[rgb(60,60,75)]",
                )}
                style={!didGo && !isPast && !isToday ? { background: "rgba(255,255,255,0.02)" } : undefined}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.07)", display: "inline-flex" }}>
        {(["calendar","workouts"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "h-8 px-5 rounded-lg text-[12.5px] font-medium transition-all duration-150 capitalize",
              tab === t ? "bg-white/[0.09] text-white" : "text-[rgb(100,100,115)] hover:text-[rgb(180,180,195)]"
            )}
          >
            {t === "calendar" ? "Calendar" : "Workout Log"}
          </button>
        ))}
      </div>

      {/* ── Calendar Tab ── */}
      {tab === "calendar" && (
        <ActivityHeatmap
          data={heatmapData}
          title="Gym Attendance"
          getLevel={(v) => v === 0 ? 0 : 4}
          tooltipLabel={(v, d) => v === 0 ? `${d}: rest day` : `${d}: trained`}
          hideLegend
        />
      )}

      {/* ── Workout Log Tab ── */}
      {tab === "workouts" && (
        sortedWeeks.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell size={40} className="mx-auto mb-3" style={{ color: "rgb(50,50,62)" }} />
            <p style={{ color: "rgb(80,80,95)" }}>No workouts logged yet. Hit "Log Workout" to start.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedWeeks.map(([weekKey, workouts]) => {
              const weekStart = parseISO(weekKey);
              const isExpanded = expandedWeeks.has(weekKey);
              const isCurrentWeek = weekKey === format(getMondayOfWeek(new Date()), "yyyy-MM-dd");
              return (
                <div key={weekKey}
                  className={cn("rounded-2xl border transition-colors", isCurrentWeek ? "border-violet-500/20" : "border-white/[0.07]")}
                  style={{ background: "rgb(22,22,26)" }}
                >
                  <button onClick={() => toggleWeek(weekKey)} className="w-full text-left px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {isCurrentWeek && <span className="text-xs font-medium text-violet-400">This week</span>}
                          <span className="text-sm font-semibold text-white">
                            {formatShortDate(weekStart)} – {formatShortDate(new Date(weekStart.getTime() + 6 * 86400000))}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "rgb(120,120,135)" }}>
                          {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-wrap">
                          {workouts.map((w) => (
                            <Badge key={w.id} variant={TYPE_COLORS[w.type]}>
                              {WORKOUT_TYPES.find((t) => t.value === w.type)?.label || w.type}
                            </Badge>
                          ))}
                        </div>
                        {isExpanded
                          ? <ChevronUp size={16} style={{ color: "rgb(120,120,135)" }} />
                          : <ChevronDown size={16} style={{ color: "rgb(120,120,135)" }} />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-3">
                      {workouts.map((w) => (
                        <div key={w.id} className="rounded-xl px-4 py-3 border border-white/[0.07] flex items-start justify-between gap-3" style={{ background: "rgb(16,16,20)" }}>
                          <div className="flex items-start gap-3 min-w-0">
                            <Badge variant={TYPE_COLORS[w.type]} className="mt-0.5 shrink-0">
                              {WORKOUT_TYPES.find((t) => t.value === w.type)?.label}
                            </Badge>
                            <div className="min-w-0">
                              <span className="text-xs" style={{ color: "rgb(120,120,135)" }}>{format(parseISO(w.date), "EEE, MMM d")}</span>
                              {w.notes && (
                                <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgb(180,183,195)" }}>{w.notes}</p>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteWorkout(w.id)} className="hover:text-red-400 transition-colors shrink-0 mt-0.5" style={{ color: "rgb(70,70,85)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Log Workout Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Workout">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select label="Type" options={WORKOUT_TYPES} value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          <Textarea label="Summary (optional)" placeholder="e.g. Heavy squats, felt strong. PR on bench." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          <Button onClick={handleSaveWorkout} loading={savingWorkout} variant="primary" className="w-full">
            Save Workout
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
