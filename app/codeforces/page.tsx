"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";
import { cn, todayStr, formatShortDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { Code2, Plus, Trash2, ExternalLink, Star, TrendingUp } from "lucide-react";

interface CfProblem {
  id: number;
  date: string;
  contestId: number;
  problemIndex: string;
  name: string;
  rating: number | null;
  link: string;
}

interface RatingChange {
  contestId: number;
  contestName: string;
  ratingUpdateTimeSeconds: number;
  newRating: number;
  oldRating: number;
}

function getRatingColor(rating: number | null): "muted" | "success" | "info" | "default" | "warning" | "danger" {
  if (!rating) return "muted";
  if (rating < 1200) return "muted";
  if (rating < 1600) return "success";
  if (rating < 1900) return "info";
  if (rating < 2100) return "default";
  if (rating < 2400) return "warning";
  return "danger";
}

function getRatingLabel(rating: number): string {
  if (rating < 1200) return "Newbie";
  if (rating < 1400) return "Pupil";
  if (rating < 1600) return "Specialist";
  if (rating < 1900) return "Expert";
  if (rating < 2100) return "Candidate Master";
  if (rating < 2300) return "Master";
  return "Grandmaster";
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgb(22,22,26)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
    color: "white",
  },
};

export default function CodeForcesPage() {
  const [problems, setProblems] = useState<CfProblem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, CfProblem[]>>({});
  const [ratings, setRatings] = useState<RatingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [link, setLink] = useState("");
  const [date, setDate] = useState(todayStr());
  const [nameOverride, setNameOverride] = useState("");
  const [ratingOverride, setRatingOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    const [probRes, ratingRes] = await Promise.all([
      fetch("/api/codeforces"),
      fetch("/api/codeforces?action=rating"),
    ]);
    const probData = await probRes.json();
    const ratingData = await ratingRes.json();
    setProblems(probData.problems || []);
    setGrouped(probData.grouped || {});
    setRatings(ratingData.rating || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!link) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/codeforces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, date, nameOverride: nameOverride || undefined, ratingOverride: ratingOverride || undefined }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to add problem");
    } else {
      setShowModal(false);
      setLink("");
      setNameOverride("");
      setRatingOverride("");
      fetchData();
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await fetch("/api/codeforces", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  const problemChartData = [...problems].reverse().map((p) => ({
    date: formatShortDate(parseISO(p.date)),
    rating: p.rating || 0,
    name: p.name,
  }));

  const ratingChartData = ratings.map((r) => ({
    date: formatShortDate(new Date(r.ratingUpdateTimeSeconds * 1000)),
    rating: r.newRating,
    contest: r.contestName,
  }));

  const todayProblems = grouped[todayStr()] || [];
  const totalSolved = problems.length;
  const currentRating = ratings.length > 0 ? ratings[ratings.length - 1].newRating : null;
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Heatmap data: problems solved per day
  const heatmapData: Record<string, number> = {};
  for (const [date, probs] of Object.entries(grouped)) {
    heatmapData[date] = probs.length;
  }

  return (
    <AppShell>
      <PageHeader
        title="Codeforces"
        description="Track problems solved and rating progress"
        action={
          <Button variant="primary" onClick={() => setShowModal(true)} size="sm">
            <Plus size={14} /> Add Problem
          </Button>
        }
      />

      {/* Stats — all consistent StatCards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 section-gap">
        <StatCard
          label="Total Solved"
          value={String(totalSolved)}
          accent="violet"
          icon={<Code2 size={16} />}
        />
        <StatCard
          label="Today"
          value={String(todayProblems.length)}
          sub={todayProblems.length >= 1 ? "✓ goal hit" : "target: 1"}
          accent={todayProblems.length >= 1 ? "green" : "neutral"}
        />
        <StatCard
          label="Current Rating"
          value={currentRating ? String(currentRating) : "—"}
          sub={currentRating ? getRatingLabel(currentRating) : "no contests yet"}
          accent="violet"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="This Week"
          value={String(
            Object.entries(grouped).filter(([d]) => {
              const diff = (new Date().getTime() - new Date(d).getTime()) / 86400000;
              return diff <= 7;
            }).reduce((s, [, ps]) => s + ps.length, 0)
          )}
          sub="problems"
          accent="neutral"
        />
      </div>

      {/* Consistency heatmap */}
      <div className="section-gap">
        <ActivityHeatmap
          data={heatmapData}
          title="Problem Solving Activity"
          getLevel={(v) => v === 0 ? 0 : v === 1 ? 2 : v === 2 ? 3 : 4}
          tooltipLabel={(v, d) => v === 0 ? `${d}: no problems` : `${d}: ${v} problem${v > 1 ? "s" : ""}`}
        />
      </div>

      {/* Problems over time chart */}
      {problemChartData.length > 1 && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4 flex items-center gap-2" style={{ color: "rgb(70,70,85)" }}>
            <Star size={12} className="text-violet-500" />
            Problem Ratings Over Time
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" type="category" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
              <YAxis dataKey="rating" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} domain={["auto", "auto"]} />
              <Tooltip
                {...TOOLTIP_STYLE}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    return (
                      <div style={TOOLTIP_STYLE.contentStyle} className="px-4 py-3">
                        <p style={{ color: "rgb(120,120,135)" }}>{d.date}</p>
                        <p className="text-violet-400 font-semibold">{d.name}</p>
                        <p className="text-white">Rating: {d.rating || "unrated"}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={problemChartData} fill="rgb(139,92,246)" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rating history chart */}
      {ratingChartData.length > 1 && (
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>
            My Rating History
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ratingChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
              <YAxis tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} domain={["auto", "auto"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    return (
                      <div style={TOOLTIP_STYLE.contentStyle} className="px-4 py-3">
                        <p style={{ color: "rgb(120,120,135)" }}>{d.date}</p>
                        <p className="text-violet-400 font-semibold">{d.rating}</p>
                        <p className="truncate max-w-[200px]" style={{ color: "rgb(90,90,105)" }}>{d.contest}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="rating" stroke="rgb(139,92,246)" strokeWidth={2} dot={{ r: 3, fill: "rgb(139,92,246)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Problems by day */}
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>
          Problems Log
        </p>
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {loading ? (
            <p className="text-sm" style={{ color: "rgb(90,90,105)" }}>Loading...</p>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-10">
              <Code2 size={40} className="mx-auto mb-3" style={{ color: "rgb(50,50,62)" }} />
              <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No problems logged yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.slice(0, 20).map((d) => {
                const dayProblems = grouped[d];
                const maxRating = dayProblems.reduce((m, p) => Math.max(m, p.rating || 0), 0);
                const showMax = dayProblems.length >= 3;
                const isToday = d === todayStr();
                return (
                  <div key={d}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium" style={{ color: "rgb(90,90,105)" }}>{format(parseISO(d), "EEE, MMM d")}</p>
                      {isToday && <Badge variant="default">Today</Badge>}
                      {showMax && maxRating > 0 && (
                        <Badge variant="warning">Best: {maxRating}</Badge>
                      )}
                    </div>
                    <div>
                      {dayProblems.map((p, i) => (
                        <div
                          key={p.id}
                          className={cn(
                            "flex items-center gap-3 py-3.5 group",
                            i < dayProblems.length - 1 && "border-b border-white/[0.04]"
                          )}
                        >
                          {p.rating && (
                            <Badge variant={getRatingColor(p.rating)} className="flex-shrink-0 rounded-md">
                              {p.rating}
                            </Badge>
                          )}
                          <span className="text-sm text-white/80 flex-1 truncate">{p.name}</span>
                          <span className="text-xs" style={{ color: "rgb(80,80,95)" }}>{p.contestId}{p.problemIndex}</span>
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors hover:text-violet-400"
                            style={{ color: "rgb(80,80,95)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="transition-colors hover:text-red-400 opacity-0 group-hover:opacity-100"
                            style={{ color: "rgb(80,80,95)" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Problem">
        <div className="space-y-4">
          <Input
            label="Codeforces URL"
            placeholder="codeforces.com/problemset/problem/1234/A"
            value={link}
            onChange={(e) => { setLink(e.target.value); setError(""); }}
            error={error}
            hint="Paste any valid CF problem link"
          />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name override (opt)"
              placeholder="Problem name"
              value={nameOverride}
              onChange={(e) => setNameOverride(e.target.value)}
            />
            <Input
              label="Rating override (opt)"
              type="number"
              placeholder="e.g. 1500"
              value={ratingOverride}
              onChange={(e) => setRatingOverride(e.target.value)}
            />
          </div>
          <p className="text-xs" style={{ color: "rgb(90,90,105)" }}>Name and rating auto-fetched from CF API if not overridden.</p>
          <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">Add Problem</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
