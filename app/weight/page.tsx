"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { todayStr, formatShortDate } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Scale, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface WeightEntry {
  id: number;
  date: string;
  weightKg: number;
}

interface WeeklyAvg {
  weekStart: string;
  avg: number;
  count: number;
  end: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "white" }} className="px-3 py-2">
        <p style={{ color: "rgb(120,120,135)" }}>{label}</p>
        <p className="text-violet-400 font-semibold">{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
};

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weeklyAverages, setWeeklyAverages] = useState<WeeklyAvg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/weight");
    const data = await res.json();
    setEntries(data.entries || []);
    setWeeklyAverages(data.weeklyAverages || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!weight || !date) return;
    setSaving(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, weightKg: parseFloat(weight) }),
    });
    setSaving(false);
    setShowModal(false);
    setWeight("");
    fetchData();
  }

  async function handleDelete(id: number) {
    await fetch("/api/weight", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  const chartData = [...entries].reverse().slice(-30).map((e) => ({
    date: formatShortDate(parseISO(e.date)),
    weight: e.weightKg,
  }));

  const latestWeight = entries[0]?.weightKg;
  const prevWeight = entries[1]?.weightKg;
  const weightChange = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
    <AppShell>
      <PageHeader
        title="Weight Tracker"
        description="Track daily weight and weekly averages"
        action={
          <Button variant="primary" onClick={() => setShowModal(true)} size="sm">
            <Plus size={14} /> Log Weight
          </Button>
        }
      />

      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>Overview</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 section-gap">
        <StatCard
          label="Current"
          value={latestWeight ? `${latestWeight} kg` : "—"}
          accent="violet"
        />
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[11.5px] font-medium mb-1.5" style={{ color: "rgb(100,100,115)" }}>Change</p>
          <p className={`text-[22px] font-semibold tabular-nums tracking-tight leading-tight ${
            weightChange === null ? "text-white" : parseFloat(weightChange) <= 0 ? "text-emerald-400" : "text-red-400"
          }`}>
            {weightChange !== null ? `${parseFloat(weightChange) > 0 ? "+" : ""}${weightChange} kg` : "—"}
          </p>
        </div>
        <StatCard
          label="Entries"
          value={entries.length.toString()}
          accent="neutral"
        />
      </div>

      {chartData.length > 1 && (
        <>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>30-Day Trend</p>
          <Card className="mb-10">
            <CardContent className="pt-5">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgb(90,90,105)" }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {weeklyAverages.length > 0 && (
        <>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>Weekly Averages</p>
          <Card className="mb-10">
            <CardContent className="pt-5">
              <div className="space-y-3">
                {[...weeklyAverages].reverse().map((w) => {
                  const idx = weeklyAverages.findIndex((x) => x.weekStart === w.weekStart);
                  const prev = idx > 0 ? weeklyAverages[idx - 1] : null;
                  const change = prev ? w.avg - prev.avg : null;
                  return (
                    <div key={w.weekStart} className="flex items-center justify-between py-2 border-b border-white/[0.07] last:border-0">
                      <div>
                        <p className="text-sm text-[rgb(210,210,220)]">
                          {formatShortDate(parseISO(w.weekStart))} – {formatShortDate(parseISO(w.end))}
                        </p>
                        <p className="text-xs" style={{ color: "rgb(90,90,105)" }}>{w.count} entries</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-violet-400">{w.avg} kg</p>
                        {change !== null && (
                          <p className={`text-xs ${change <= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {change > 0 ? "+" : ""}{change.toFixed(1)} kg
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>All Entries</p>
      <Card>
        <CardContent className="pt-5">
          {loading ? (
            <p className="text-sm" style={{ color: "rgb(90,90,105)" }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <Scale size={40} className="mx-auto mb-2" style={{ color: "rgb(50,50,62)" }} />
              <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No entries yet. Log your first weight!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.07] last:border-0 group">
                  <p className="text-sm text-[rgb(210,210,220)]">{format(parseISO(e.date), "EEE, MMM d yyyy")}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-violet-400 tabular-nums">{e.weightKg} kg</p>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-[rgb(80,80,95)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Weight">
        <div className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            placeholder="e.g. 75.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">Save</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
