"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { minutesToHours } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from "date-fns";
import { FileText, ChevronLeft, ChevronRight, Dumbbell, Code2, Clock, ChevronDown } from "lucide-react";

interface WeekStats {
  gymDays: number;
  cfProblems: number;
  deepWorkMinutes: number;
  weekLabel: string;
}

interface Review {
  id: number;
  weekStart: string;
  wins: string | null;
  struggles: string | null;
  learnings: string | null;
  nextWeekFocus: string | null;
  weeklyLearning: string | null;
}

interface AllReview extends Review {
  weekStats?: WeekStats;
}

export default function WeeklyReviewPage() {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(mon, "yyyy-MM-dd");
  });
  const [review, setReview] = useState<Review | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [allReviews, setAllReviews] = useState<AllReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");
  const [learnings, setLearnings] = useState("");
  const [nextWeekFocus, setNextWeekFocus] = useState("");
  const [weeklyLearning, setWeeklyLearning] = useState("");

  async function fetchWeek(weekStr: string) {
    setLoading(true);
    const res = await fetch(`/api/weekly-review?week=${weekStr}`);
    const data = await res.json();
    setReview(data.review || null);
    setWeekStats(data.weekStats || null);

    if (data.review) {
      setWins(data.review.wins || "");
      setStruggles(data.review.struggles || "");
      setLearnings(data.review.learnings || "");
      setNextWeekFocus(data.review.nextWeekFocus || "");
      setWeeklyLearning(data.review.weeklyLearning || "");
    } else {
      setWins(""); setStruggles(""); setLearnings(""); setNextWeekFocus(""); setWeeklyLearning("");
    }
    setLoading(false);
  }

  async function fetchAll() {
    const res = await fetch("/api/weekly-review");
    const data = await res.json();
    setAllReviews(data.reviews || []);
  }

  useEffect(() => {
    fetchWeek(selectedWeek);
    fetchAll();
  }, [selectedWeek]);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: selectedWeek, wins, struggles, learnings, nextWeekFocus, weeklyLearning }),
    });
    setSaving(false);
    fetchWeek(selectedWeek);
    fetchAll();
  }

  function prevWeek() {
    const d = parseISO(selectedWeek);
    setSelectedWeek(format(subWeeks(d, 1), "yyyy-MM-dd"));
  }

  function nextWeek() {
    const d = parseISO(selectedWeek);
    const next = new Date(d.getTime() + 7 * 86400000);
    if (next <= new Date()) {
      setSelectedWeek(format(next, "yyyy-MM-dd"));
    }
  }

  const weekEnd = endOfWeek(parseISO(selectedWeek), { weekStartsOn: 1 });
  const isCurrentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd") === selectedWeek;

  return (
    <AppShell>
      <PageHeader title="Weekly Review" description="Sunday reflection and weekly learning log" />

      {/* Week navigator */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={prevWeek}
          className="p-2 rounded-xl transition-colors hover:bg-[rgb(22,22,26)]"
          style={{ color: "rgb(90,90,105)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-[rgb(210,210,220)]">
            {format(parseISO(selectedWeek), "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            {isCurrentWeek && <span className="ml-2 text-xs text-violet-400">This week</span>}
          </p>
        </div>
        <button
          onClick={nextWeek}
          disabled={isCurrentWeek}
          className="p-2 rounded-xl transition-colors hover:bg-[rgb(22,22,26)] disabled:opacity-30 disabled:cursor-default"
          style={{ color: "rgb(90,90,105)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week stats */}
      {weekStats && (
        <div className="grid grid-cols-3 gap-5 section-gap">
          <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6 flex items-center gap-3">
            <Dumbbell size={16} className="text-violet-400" />
            <div>
              <p className="text-lg font-bold text-white tabular-nums tracking-tight">{weekStats.gymDays}/5</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>Gym days</p>
            </div>
          </div>
          <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6 flex items-center gap-3">
            <Code2 size={16} className="text-violet-400" />
            <div>
              <p className="text-lg font-bold text-white tabular-nums tracking-tight">{weekStats.cfProblems}</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>CF problems</p>
            </div>
          </div>
          <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl p-6 flex items-center gap-3">
            <Clock size={16} className="text-emerald-400" />
            <div>
              <p className="text-lg font-bold text-white tabular-nums tracking-tight">{weekStats.deepWorkMinutes > 0 ? minutesToHours(weekStats.deepWorkMinutes) : "—"}</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>Deep work</p>
            </div>
          </div>
        </div>
      )}

      {/* Review form */}
      <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl section-gap">
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <FileText size={14} className="text-violet-400" />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgb(70,70,85)" }}>Weekly Reflection</p>
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-5">
            <Textarea
              label="Wins 🏆"
              placeholder="What went well this week?"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              rows={3}
            />
            <Textarea
              label="Struggles 🧗"
              placeholder="What was hard? What can improve?"
              value={struggles}
              onChange={(e) => setStruggles(e.target.value)}
              rows={3}
            />
            <Textarea
              label="Key Learnings 🧠"
              placeholder="Top things learned this week..."
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              rows={3}
            />
            <Textarea
              label="Weekly Learning Log 📚"
              placeholder="Detailed log of everything you studied, read, or practiced..."
              value={weeklyLearning}
              onChange={(e) => setWeeklyLearning(e.target.value)}
              rows={4}
            />
            <Textarea
              label="Focus for Next Week 🎯"
              placeholder="What are your top priorities next week?"
              value={nextWeekFocus}
              onChange={(e) => setNextWeekFocus(e.target.value)}
              rows={2}
            />
            <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">
              {review ? "Update Review" : "Save Review"}
            </Button>
          </div>
        </div>
      </div>

      {/* Archive */}
      {allReviews.length > 0 && (
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>Past Reviews</p>
          <div className="space-y-3">
            {allReviews
              .filter((r) => r.weekStart !== selectedWeek)
              .map((r) => {
                const ws = parseISO(r.weekStart);
                const we = endOfWeek(ws, { weekStartsOn: 1 });
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedWeek(r.weekStart)}
                    className="w-full bg-[rgb(22,22,26)] border border-white/[0.07] rounded-2xl px-6 py-5 flex items-center justify-between hover:border-white/[0.12] transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-[rgb(210,210,220)]">
                        {format(ws, "MMM d")} – {format(we, "MMM d, yyyy")}
                      </p>
                      {r.wins && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgb(120,120,135)" }}>{r.wins}</p>}
                    </div>
                    <ChevronDown size={14} className="-rotate-90" style={{ color: "rgb(90,90,105)" }} />
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
