"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { format, parseISO } from "date-fns";
import { todayStr, formatShortDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
} from "recharts";
import { ActivityHeatmap, EMERALD_COLORS } from "@/components/ui/activity-heatmap";
import { Footprints, Plus } from "lucide-react";

interface StepEntry {
  id: number;
  date: string;
  count: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "white" }} className="px-3 py-2">
        <p style={{ color: "rgb(120,120,135)" }} className="mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-violet-400 font-semibold">{p.value?.toLocaleString()} steps</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StepsPage() {
  const [entries, setEntries] = useState<StepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [count, setCount] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/steps");
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    if (!count || !date) return;
    setSaving(true);
    await fetch("/api/steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, count: parseInt(count) }),
    });
    setSaving(false);
    setShowModal(false);
    setCount("");
    fetchData();
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sorted.slice(-30);

  const chartData = last30.map((e) => ({
    date: formatShortDate(parseISO(e.date)),
    steps: e.count,
  }));

  const movingAvg = last30.map((e, i) => {
    const window = last30.slice(Math.max(0, i - 6), i + 1);
    const avg = Math.round(window.reduce((s, x) => s + x.count, 0) / window.length);
    return { date: formatShortDate(parseISO(e.date)), avg };
  });

  const heatmapData: Record<string, number> = {};
  for (const e of entries) heatmapData[e.date] = e.count;

  const todayEntry = entries.find((e) => e.date === todayStr());
  const avgSteps = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.count, 0) / entries.length) : 0;
  const bestDay = entries.length > 0 ? entries.reduce((m, e) => e.count > m.count ? e : m, entries[0]) : null;

  return (
    <AppShell>
      <PageHeader
        title="Steps"
        description="Daily step count tracking"
        action={
          <Button variant="primary" onClick={() => setShowModal(true)} size="sm">
            <Plus size={14} /> Log Steps
          </Button>
        }
      />

      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>Overview</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 section-gap">
        <StatCard
          label="Today"
          value={todayEntry ? todayEntry.count.toLocaleString() : "—"}
          accent="violet"
        />
        <StatCard
          label="Daily Avg"
          value={avgSteps.toLocaleString()}
          accent="violet"
        />
        <StatCard
          label="Best Day"
          value={bestDay ? bestDay.count.toLocaleString() : "—"}
          accent="green"
        />
      </div>

      <div className="section-gap">
        <ActivityHeatmap
          data={heatmapData}
          title="Daily Steps Consistency"
          colors={EMERALD_COLORS}
          getLevel={(v) => v === 0 ? 0 : v < 5000 ? 1 : v < 8000 ? 2 : v < 10000 ? 3 : 4}
          tooltipLabel={(v, d) => v === 0 ? `${d}: not logged` : `${d}: ${v.toLocaleString()} steps`}
        />
      </div>

      {chartData.length > 1 && (
        <>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>Daily Steps (Last 30 Days)</p>
          <Card className="mb-8">
            <CardContent className="pt-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="steps" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>7-Day Moving Average</p>
          <Card className="mb-10">
            <CardContent className="pt-5">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={movingAvg} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(90,90,105)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="avg" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: "rgb(70,70,85)" }}>History</p>
      <Card>
        <CardContent className="pt-5">
          {loading ? (
            <p className="text-sm" style={{ color: "rgb(90,90,105)" }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <Footprints size={40} className="mx-auto mb-2" style={{ color: "rgb(50,50,62)" }} />
              <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>No entries yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.07] last:border-0">
                  <p className="text-sm text-[rgb(210,210,220)]">{format(parseISO(e.date), "EEE, MMM d yyyy")}</p>
                  <p className="text-sm font-semibold text-violet-400 tabular-nums">{e.count.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Steps">
        <div className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="Step Count"
            type="number"
            placeholder="e.g. 8500"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <p className="text-xs flex items-center gap-1.5" style={{ color: "rgb(90,90,105)" }}>
            <span>📱</span> Apple Health / Google Fit import coming soon
          </p>
          <Button variant="primary" onClick={handleSave} loading={saving} className="w-full">Save</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
