"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { todayStr, formatShortDate, minutesToHours } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { Clock, Plus } from "lucide-react";

interface DeepWorkEntry {
  id: number;
  date: string;
  minutes: number;
  notes?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[rgb(22,22,26)] border border-white/[0.07] rounded-xl px-3 py-2 text-sm">
        <p style={{ color: "rgb(160,163,175)" }}>{label}</p>
        <p className="text-violet-400 font-semibold">{minutesToHours(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DeepWorkPage() {
  const [entries, setEntries] = useState<DeepWorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/deep-work");
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSave() {
    const total = (parseInt(hours || "0") * 60) + parseInt(mins || "0");
    if (total === 0) return;
    setSaving(true);
    await fetch("/api/deep-work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, minutes: total, notes }),
    });
    setSaving(false);
    setShowModal(false);
    setHours("");
    setMins("");
    setNotes("");
    fetchData();
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sorted.slice(-30);
  const chartData = last30.map((e) => ({
    date: formatShortDate(parseISO(e.date)),
    minutes: e.minutes,
  }));

  const todayEntry = entries.find((e) => e.date === todayStr());
  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);
  const avgMinutes = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;
  const weekEntries = entries.filter((e) => {
    const d = parseISO(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= weekAgo;
  });
  const weekTotal = weekEntries.reduce((s, e) => s + e.minutes, 0);

  return (
    <AppShell>
      <PageHeader
        title="Deep Work"
        description="Track focused, distraction-free work sessions"
        action={
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus size={14} /> Log Session
          </Button>
        }
      />

      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
        style={{ color: "rgb(70,70,85)" }}
      >
        Overview
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 section-gap">
        <StatCard
          label="Today"
          value={todayEntry ? minutesToHours(todayEntry.minutes) : "—"}
          accent="violet"
        />
        <StatCard
          label="This Week"
          value={weekTotal > 0 ? minutesToHours(weekTotal) : "—"}
          accent="blue"
        />
        <StatCard
          label="Daily Avg"
          value={avgMinutes > 0 ? minutesToHours(avgMinutes) : "—"}
          accent="neutral"
        />
      </div>

      {chartData.length > 1 && (
        <>
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
            style={{ color: "rgb(70,70,85)" }}
          >
            Daily Deep Work (Last 30 Days)
          </p>
          <Card className="mb-10">
            <CardContent className="pt-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgb(110,113,125)" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "rgb(110,113,125)" }}
                    tickFormatter={(v) => `${Math.floor(v / 60)}h`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={240} stroke="rgb(139,92,246)" strokeDasharray="4 4" label={{ value: "4h goal", fill: "rgb(139,92,246)", fontSize: 10 }} />
                  <Bar dataKey="minutes" fill="rgb(139,92,246)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.1em] mb-4"
        style={{ color: "rgb(70,70,85)" }}
      >
        History
      </p>
      <Card>
        <CardContent className="pt-5">
          {loading ? (
            <p className="text-[13.5px]" style={{ color: "rgb(120,120,135)" }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={40} className="mx-auto mb-3" style={{ color: "rgb(50,50,62)" }} />
              <p className="text-sm" style={{ color: "rgb(80,80,95)" }}>Start logging your deep work sessions.</p>
            </div>
          ) : (
            <div>
              {entries.map((e) => (
                <div key={e.id} className="px-0 py-4 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[rgb(210,210,220)]">{format(parseISO(e.date), "EEE, MMM d yyyy")}</p>
                    <p className="text-sm font-semibold text-violet-400 tabular-nums">{minutesToHours(e.minutes)}</p>
                  </div>
                  {e.notes && <p className="text-xs mt-0.5" style={{ color: "rgb(120,120,135)" }}>{e.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Deep Work">
        <div className="space-y-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hours"
              type="number"
              placeholder="0"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <Input
              label="Minutes"
              type="number"
              placeholder="0"
              min="0"
              max="59"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
            />
          </div>
          <Textarea
            label="Notes (optional)"
            placeholder="What did you work on?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <Button onClick={handleSave} loading={saving} className="w-full">Save</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
