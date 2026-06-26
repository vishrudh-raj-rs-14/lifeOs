"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Scale, Footprints, Dumbbell, Clock, Monitor, Moon, Briefcase,
  Salad, BookOpen, BookMarked, Target, CheckCircle2, Circle,
  ChevronRight, Flame, Zap, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { todayStr, minutesToHours } from "@/lib/utils";

interface ScorecardData {
  date: string;
  weight: { logged: boolean; value: number | null };
  workout: { logged: boolean; type: string | null };
  steps: { logged: boolean; count: number | null; hit10k: boolean };
  screenTime: { logged: boolean; youtubeMinutes: number | null; socialMinutes: number | null; noSocial: boolean };
  deepWork: { logged: boolean; minutes: number | null; hit4h: boolean };
  sleep: { logged: boolean; hours: number | null; hit7h: boolean };
  project: { logged: boolean; minutes: number | null };
  wholefoods: { logged: boolean; percent: number | null; hit90: boolean };
  techReading: { logged: boolean };
  nonfiction: { logged: boolean };
  plannedTomorrow: { done: boolean; count: number };
}

interface QuickLogModal {
  habit: string;
  label: string;
  unit: string;
  placeholder: string;
  step?: number;
}

interface Category {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  items: Item[];
}

interface Item {
  id: string;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  value: string | null;
  href?: string;
  quickLog?: QuickLogModal;
  isToggle?: boolean;
  toggleHabit?: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDayLabel(score: number, total: number): { text: string; color: string } {
  const pct = score / total;
  if (pct === 1) return { text: "Perfect Day!", color: "rgb(52,211,153)" };
  if (pct >= 0.75) return { text: "Crushing it!", color: "rgb(52,211,153)" };
  if (pct >= 0.5) return { text: "Solid progress", color: "rgb(251,191,36)" };
  if (pct >= 0.25) return { text: "Keep going", color: "rgb(251,146,60)" };
  return { text: "Just getting started", color: "rgb(139,92,246)" };
}

export default function DashboardPage() {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<QuickLogModal | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/scorecard?date=${todayStr()}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleQuickLog() {
    if (!showModal || !inputVal) return;
    setSaving(true);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr(), habit: showModal.habit, value: parseFloat(inputVal) }),
    });
    setSaving(false);
    setShowModal(null);
    setInputVal("");
    fetchData();
  }

  async function handleToggle(habitKey: string) {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr(), habit: habitKey, value: 1 }),
    });
    fetchData();
  }

  if (loading || !data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const d = data;

  const categories: Category[] = [
    {
      name: "Health",
      color: "rgb(52,211,153)",
      bgColor: "rgba(52,211,153,0.06)",
      borderColor: "rgba(52,211,153,0.15)",
      items: [
        {
          id: "weight",
          label: "Log Weight",
          icon: <Scale size={15} />,
          done: d.weight.logged,
          value: d.weight.value ? `${d.weight.value} kg` : null,
          href: "/weight",
        },
        {
          id: "workout",
          label: "Workout",
          icon: <Dumbbell size={15} />,
          done: d.workout.logged,
          value: d.workout.type ? d.workout.type.replace("_", " ") : null,
          href: "/gym",
        },
        {
          id: "steps",
          label: "10k Steps",
          icon: <Footprints size={15} />,
          done: d.steps.hit10k,
          value: d.steps.count ? d.steps.count.toLocaleString() : null,
          href: "/steps",
        },
        {
          id: "wholefoods",
          label: "Whole Foods 90%",
          icon: <Salad size={15} />,
          done: d.wholefoods.hit90,
          value: d.wholefoods.percent ? `${d.wholefoods.percent}%` : null,
          quickLog: { habit: "whole_foods", label: "Whole Foods %", unit: "%", placeholder: "90", step: 5 },
        },
        {
          id: "sleep",
          label: "Sleep 7h+",
          icon: <Moon size={15} />,
          done: d.sleep.hit7h,
          value: d.sleep.hours ? `${d.sleep.hours}h` : null,
          quickLog: { habit: "sleep", label: "Sleep hours", unit: "hrs", placeholder: "7.5", step: 0.5 },
        },
      ],
    },
    {
      name: "Focus",
      color: "rgb(96,165,250)",
      bgColor: "rgba(96,165,250,0.05)",
      borderColor: "rgba(96,165,250,0.15)",
      items: [
        {
          id: "screentime",
          label: "Screen Time Tracked",
          icon: <Monitor size={15} />,
          done: d.screenTime.logged,
          value: d.screenTime.youtubeMinutes !== null
            ? `${minutesToHours(d.screenTime.youtubeMinutes + (d.screenTime.socialMinutes ?? 0))} social`
            : null,
          href: "/screen-time",
        },
        {
          id: "nosocial",
          label: "No YouTube / Social",
          icon: <Monitor size={15} />,
          done: d.screenTime.noSocial,
          value: d.screenTime.logged
            ? d.screenTime.noSocial ? "Under 30min" : `${d.screenTime.youtubeMinutes ?? 0 + (d.screenTime.socialMinutes ?? 0)}min`
            : null,
          href: "/screen-time",
        },
        {
          id: "deepwork",
          label: "4h Deep Work",
          icon: <Clock size={15} />,
          done: d.deepWork.hit4h,
          value: d.deepWork.minutes ? minutesToHours(d.deepWork.minutes) : null,
          href: "/deep-work",
        },
      ],
    },
    {
      name: "Growth",
      color: "rgb(167,139,250)",
      bgColor: "rgba(139,92,246,0.06)",
      borderColor: "rgba(139,92,246,0.15)",
      items: [
        {
          id: "project",
          label: "Project Work",
          icon: <Briefcase size={15} />,
          done: d.project.logged && (d.project.minutes ?? 0) > 0,
          value: d.project.minutes ? minutesToHours(d.project.minutes) : null,
          quickLog: { habit: "project", label: "Project time (min)", unit: "min", placeholder: "60", step: 15 },
        },
        {
          id: "techreading",
          label: "Tech Reading",
          icon: <BookOpen size={15} />,
          done: d.techReading.logged,
          value: d.techReading.logged ? "Done" : null,
          isToggle: true,
          toggleHabit: "tech_reading",
        },
        {
          id: "nonfiction",
          label: "Non-Fiction",
          icon: <BookMarked size={15} />,
          done: d.nonfiction.logged,
          value: d.nonfiction.logged ? "Done" : null,
          isToggle: true,
          toggleHabit: "nonfiction",
        },
      ],
    },
    {
      name: "Night Review",
      color: "rgb(251,191,36)",
      bgColor: "rgba(251,191,36,0.05)",
      borderColor: "rgba(251,191,36,0.15)",
      items: [
        {
          id: "planned",
          label: "Plan Tomorrow",
          icon: <Target size={15} />,
          done: d.plannedTomorrow.done,
          value: d.plannedTomorrow.done ? `${d.plannedTomorrow.count} goals set` : null,
          href: "/goals",
        },
      ],
    },
  ];

  const allItems = categories.flatMap((c) => c.items);
  const completedCount = allItems.filter((i) => i.done).length;
  const totalCount = allItems.length;
  const scorePct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const dayLabel = getDayLabel(completedCount, totalCount);
  const dateLabel = format(parseISO(d.date), "EEEE, MMMM d");

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[13px] font-medium mb-1.5" style={{ color: "rgb(80,80,98)" }}>
          {dateLabel}
        </p>
        <h1 className="text-[30px] font-bold text-white tracking-tight leading-tight mb-1">
          {getGreeting()}, Vishrudh
        </h1>
        <p className="text-[14px]" style={{ color: dayLabel.color }}>{dayLabel.text}</p>
      </div>

      {/* Score card */}
      <div
        className="rounded-2xl p-6 mb-10"
        style={{
          background: "linear-gradient(135deg, rgba(109,40,217,0.15), rgba(139,92,246,0.05))",
          border: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[42px] font-bold text-white tabular-nums leading-none">
                {completedCount}
              </span>
              <span className="text-[20px] font-medium" style={{ color: "rgb(100,90,140)" }}>
                / {totalCount}
              </span>
            </div>
            <p className="text-[13px] mt-1.5" style={{ color: "rgb(130,115,180)" }}>
              habits completed today
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.2)", color: "rgb(167,139,250)" }}
          >
            <Zap size={22} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${scorePct}%`,
              background: scorePct >= 100
                ? "rgb(52,211,153)"
                : scorePct >= 75 ? "linear-gradient(90deg, rgb(139,92,246), rgb(52,211,153))"
                : scorePct >= 50 ? "linear-gradient(90deg, rgb(139,92,246), rgb(251,191,36))"
                : "rgb(139,92,246)",
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[12px]" style={{ color: "rgb(100,90,140)" }}>
            {Math.round(scorePct)}% of the day scored
          </p>
          {completedCount === totalCount && (
            <span className="text-[12px] font-semibold" style={{ color: "rgb(52,211,153)" }}>
              🏆 Perfect day!
            </span>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catDone = cat.items.filter((i) => i.done).length;
          const catComplete = catDone === cat.items.length;

          return (
            <div key={cat.name}>
              {/* Category header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: catComplete ? cat.color : "rgba(255,255,255,0.15)" }}
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>
                    {cat.name}
                  </p>
                </div>
                <p className="text-[11px] font-medium" style={{ color: catComplete ? cat.color : "rgb(65,65,80)" }}>
                  {catDone}/{cat.items.length}
                </p>
              </div>

              {/* Items */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: catComplete ? cat.bgColor : "rgb(16,16,20)",
                  border: `1px solid ${catComplete ? cat.borderColor : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.3s ease",
                }}
              >
                {cat.items.map((item, idx) => {
                  const isLast = idx === cat.items.length - 1;
                  const canClick = item.href || item.quickLog || item.isToggle;

                  const content = (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 px-5 py-4 ${canClick && !item.href ? "cursor-pointer hover:bg-white/[0.025]" : ""} transition-colors`}
                      style={!isLast ? { borderBottom: "1px solid rgba(255,255,255,0.04)" } : {}}
                      onClick={() => {
                        if (item.quickLog) { setShowModal(item.quickLog); setInputVal(""); }
                        else if (item.isToggle && item.toggleHabit && !item.done) handleToggle(item.toggleHabit);
                      }}
                    >
                      {/* Check indicator */}
                      <div className="flex-shrink-0">
                        {item.done ? (
                          <CheckCircle2 size={20} style={{ color: cat.color }} />
                        ) : (
                          <Circle size={20} style={{ color: "rgba(255,255,255,0.15)" }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[14px] font-medium"
                            style={{ color: item.done ? "rgb(220,220,235)" : "rgb(160,160,180)" }}
                          >
                            {item.label}
                          </span>
                          {item.value && (
                            <span
                              className="text-[12px] font-medium tabular-nums"
                              style={{ color: item.done ? cat.color : "rgb(90,90,108)" }}
                            >
                              {item.value}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow for linked items */}
                      {item.href && (
                        <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
                      )}
                      {(item.quickLog || (item.isToggle && !item.done)) && (
                        <div
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgb(100,100,115)" }}
                        >
                          {item.isToggle ? "Tap done" : "Log"}
                        </div>
                      )}
                    </div>
                  );

                  if (item.href) {
                    return (
                      <Link key={item.id} href={item.href} className="block hover:bg-white/[0.025] transition-colors">
                        {content}
                      </Link>
                    );
                  }
                  return content;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats row */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        <Link
          href="/gym"
          className="rounded-2xl p-4 transition-all hover:brightness-110"
          style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Dumbbell size={16} className="mb-3 text-violet-400" />
          <p className="text-[20px] font-bold text-white tabular-nums">—</p>
          <p className="text-[11px] mt-1" style={{ color: "rgb(70,70,85)" }}>Gym / workout</p>
        </Link>
        <Link
          href="/codeforces"
          className="rounded-2xl p-4 transition-all hover:brightness-110"
          style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <TrendingUp size={16} className="mb-3 text-violet-400" />
          <p className="text-[20px] font-bold text-white tabular-nums">—</p>
          <p className="text-[11px] mt-1" style={{ color: "rgb(70,70,85)" }}>CF Problems</p>
        </Link>
        <Link
          href="/goals"
          className="rounded-2xl p-4 transition-all hover:brightness-110"
          style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Flame size={16} className="mb-3 text-violet-400" />
          <p className="text-[20px] font-bold text-white tabular-nums">—</p>
          <p className="text-[11px] mt-1" style={{ color: "rgb(70,70,85)" }}>Goal streak</p>
        </Link>
      </div>

      {/* Quick log modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-7 animate-scale-in"
            style={{ background: "rgb(20,20,24)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: "rgb(80,80,95)" }}>
              Quick log
            </p>
            <p className="text-[20px] font-bold text-white mb-6">{showModal.label}</p>

            <div className="flex items-center gap-3 mb-6">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={showModal.placeholder}
                autoFocus
                className="flex-1 h-12 rounded-2xl px-4 text-[16px] font-medium text-white focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                step={showModal.step ?? 1}
                min="0"
                onKeyDown={(e) => e.key === "Enter" && handleQuickLog()}
              />
              <span className="text-[14px] font-medium" style={{ color: "rgb(80,80,95)" }}>
                {showModal.unit}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 h-12 rounded-2xl text-[14px] font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgb(110,110,125)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickLog}
                disabled={saving || !inputVal}
                className="flex-1 h-12 rounded-2xl text-[14px] font-semibold transition-all disabled:opacity-40"
                style={{ background: "rgba(139,92,246,0.25)", color: "rgb(167,139,250)", border: "1px solid rgba(139,92,246,0.3)" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
